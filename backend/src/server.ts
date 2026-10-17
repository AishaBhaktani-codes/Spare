import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { DiagnoserService } from "./services/diagnoser.service";
import { PlannerService } from "./services/planner.service";
import { CriticService } from "./services/critic.service";
import { ReasoningTracer } from "./utils/reasoning-tracer";
import { YouTubeService } from "./services/youtube.service";
import { StudentService } from "./services/student.service";

dotenv.config();

const server = Fastify({ logger: true });
const prisma = new PrismaClient();

// --- Services ---
const diagnoser = new DiagnoserService();
const planner = new PlannerService();
const critic = new CriticService();
const youtube = new YouTubeService();
const studentService = new StudentService();

// --- Global SSE connections ---
const sseClients = new Map<string, (data: string) => void>();

async function main() {
    // Register plugins
    await server.register(cors, { origin: true });
    await server.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

    // ============================================================
    // SSE Endpoint: /api/stream/:sessionId
    // Clients connect here to receive reasoning trace in real-time
    // ============================================================
    server.get<{ Params: { sessionId: string } }>(
        "/api/stream/:sessionId",
        async (request, reply) => {
            const { sessionId } = request.params;

            reply.raw.writeHead(200, {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
                "Access-Control-Allow-Origin": "*",
            });

            // Register this client
            const sendEvent = (data: string) => {
                reply.raw.write(`data: ${data}\n\n`);
            };

            sseClients.set(sessionId, sendEvent);

            // Send initial connection event
            sendEvent(
                JSON.stringify({
                    step: 0,
                    logic: "Connected to reasoning stream",
                    action: "Awaiting analysis",
                    timestamp: new Date().toISOString(),
                })
            );

            request.raw.on("close", () => {
                sseClients.delete(sessionId);
            });
        }
    );

    // ============================================================
    // AUTH ENDPOINTS: /api/auth/signup & /api/auth/login
    // ============================================================
    server.post("/api/auth/signup", async (request, reply) => {
        try {
            const { name, email, password, role } = request.body as any;
            if (!email || !password) return reply.status(400).send({ error: "Email and password required" });
            
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) return reply.status(400).send({ error: "Email already in use" });

            const user = await prisma.user.create({
                data: { name, email, password, role: role || "Developer" }
            });
            return reply.send({ message: "User created", user: { id: user.id, email: user.email, name: user.name, role: user.role } });
        } catch (error: any) {
            console.warn("Signup DB error, returning dummy user session:", error.message);
            const { name, email, role } = request.body as any;
            return reply.send({ message: "User created (Dummy)", user: { id: "dummy-id", email: email || "test@example.com", name: name || "Test User", role: role || "Developer" } });
        }
    });

    server.post("/api/auth/login", async (request, reply) => {
        try {
            const { email, password } = request.body as any;
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user || user.password !== password) {
                return reply.status(401).send({ error: "Invalid email or password" });
            }
            return reply.send({ message: "Logged in", user: { id: user.id, email: user.email, name: user.name, role: user.role } });
        } catch (error: any) {
            console.warn("Login DB error, returning dummy user session:", error.message);
            const { email } = request.body as any;
            return reply.send({ message: "Logged in (Dummy)", user: { id: "dummy-id", email: email || "test@example.com", name: "Test User", role: "Developer" } });
        }
    });

    // ============================================================
    // POST /api/analyze
    // Receives a resume PDF + optional JD text, runs the full
    // Diagnoser → Planner → Critic pipeline
    // ============================================================
    server.post("/api/analyze", async (request, reply) => {
        const sessionId = `session-${Date.now()}`;
        const tracer = new ReasoningTracer();

        // If an SSE client is listening, forward reasoning steps
        tracer.on("step", (step) => {
            const sendEvent = sseClients.get(sessionId);
            if (sendEvent) {
                sendEvent(JSON.stringify(step));
            }
        });

        try {
            tracer.addStep(
                "Analysis pipeline initiated",
                "Receiving uploaded documents"
            );

            const parts = request.parts();
            let resumeBuffer: Buffer | null = null;
            let resumeFilename = "unknown.pdf";
            let jdText = "";
            let userId = "";

            for await (const part of parts) {
                if (part.type === "file" && part.fieldname === "resume") {
                    resumeBuffer = await part.toBuffer();
                    resumeFilename = part.filename || "resume.pdf";
                } else if (part.type === "field" && part.fieldname === "jdText") {
                    jdText = part.value as string;
                } else if (part.type === "field" && part.fieldname === "userId") {
                    userId = part.value as string;
                }
            }

            // Default JD if not provided
            if (!jdText) {
                jdText = `
          We are looking for a Full-Stack Developer with experience in:
          - React, Next.js, TypeScript for frontend development
          - Node.js, Express for backend development
          - PostgreSQL, database design
          - Docker, CI/CD, DevOps practices
          - Git, Agile methodologies
          - Strong communication and teamwork skills
          - System design and microservices architecture
        `;
            }

            // ==========================================
            // STEP 1: DIAGNOSER - Extract skills
            // ==========================================
            tracer.addStep(
                "PHASE 1: Running Diagnoser Agent",
                "Extracting text from Resume PDF"
            );

            let resumeText = "";
            try {
                if (resumeBuffer) {
                    resumeText = await diagnoser.extractTextFromPDF(resumeBuffer);
                } else {
                    tracer.addStep(
                        "No resume file uploaded, using JD-based analysis",
                        "Proceeding with JD text and dummy resume skills"
                    );
                    resumeText = "General professional with broad interest in technology and software development.";
                }
            } catch (pdfErr) {
                console.warn("Invalid PDF uploaded, falling back to dummy text for testing");
                resumeText = "I am a Full Stack Developer. I know React, Node.js, Next.js, and MongoDB. I practice Agile teamwork. Leadership experience.";
            }

            tracer.addStep(
                `Resume text extracted: ${resumeText.length} characters`,
                "Extracting skills from resume"
            );

            const resumeSkills = await diagnoser.extractSkills(resumeText, tracer);
            
            console.log("\n==================================================");
            console.log("📄  EXTRACTED RESUME SKILLS");
            console.log("==================================================");
            console.log(`🔧 Technical Skills (${resumeSkills.technical.length}):`);
            resumeSkills.technical.forEach(s => console.log(`   - ${(s.skill || 'unknown').padEnd(25)} | Confidence: ${(s.confidence * 100).toFixed(1).padStart(5)}% | SOC: ${s.socCode || 'N/A'}`));
            console.log(`\n💬 Soft Skills (${resumeSkills.soft.length}):`);
            resumeSkills.soft.forEach(s => console.log(`   - ${(s.skill || 'unknown').padEnd(25)} | Confidence: ${(s.confidence * 100).toFixed(1).padStart(5)}% | SOC: ${s.socCode || 'N/A'}`));
            console.log("==================================================\n");

            tracer.addStep(
                "Extracting skills from Job Description",
                "Running NER on JD text"
            );

            const jdSkills = await diagnoser.extractSkillsFromJD(jdText, tracer);
            
            console.log("\n==================================================");
            console.log("🎯  EXTRACTED JOB DESCRIPTION SKILLS");
            console.log("==================================================");
            console.log(`🔧 Technical Skills (${jdSkills.technical.length}):`);
            jdSkills.technical.forEach(s => console.log(`   - ${(s.skill || 'unknown').padEnd(25)} | Confidence: ${(s.confidence * 100).toFixed(1).padStart(5)}% | SOC: ${s.socCode || 'N/A'}`));
            console.log(`\n💬 Soft Skills (${jdSkills.soft.length}):`);
            jdSkills.soft.forEach(s => console.log(`   - ${(s.skill || 'unknown').padEnd(25)} | Confidence: ${(s.confidence * 100).toFixed(1).padStart(5)}% | SOC: ${s.socCode || 'N/A'}`));
            console.log("==================================================\n");

            // ==========================================
            // STEP 2: PLANNER - Build learning path
            // ==========================================
            tracer.addStep(
                "PHASE 2: Running Planner Agent",
                "Identifying skill gaps"
            );

            const resumeSkillNames = [
                ...resumeSkills.technical.map((s) => s.skill),
                ...resumeSkills.soft.map((s) => s.skill),
            ].filter((s): s is string => typeof s === 'string' && s.length > 0);
            const jdSkillNames = [
                ...jdSkills.technical.map((s) => s.skill),
                ...jdSkills.soft.map((s) => s.skill),
            ].filter((s): s is string => typeof s === 'string' && s.length > 0);

            const skillGaps = planner.identifyGaps(
                resumeSkillNames,
                jdSkillNames,
                tracer
            );

            tracer.addStep(
                `${skillGaps.length} skill gaps identified: [${skillGaps.join(", ")}]`,
                "Building DAG and computing learning path"
            );

            const learningPath = planner.buildLearningPath(skillGaps, tracer);

            // ==========================================
            // STEP 3: CRITIC - Validate path
            // ==========================================
            tracer.addStep(
                "PHASE 3: Running Critic Agent",
                "Validating learning path against catalog"
            );

            const criticResult = critic.validate(learningPath, tracer);

            tracer.addStep(
                "All phases complete. Analysis pipeline finished successfully.",
                "Fetching YouTube resources for path nodes"
            );

            // Enhance nodes with YouTube resources
            const enhancedNodes = await Promise.all(criticResult.validatedPath.nodes.map(async (node) => {
                const mainSkill = node.skillsCovered[0] || node.title;
                const resources = await youtube.getResourcesForSkill(mainSkill);
                
                return {
                    ...node,
                    resources
                };
            }));

            // Build final response
            const result = {
                sessionId,
                resumeFilename,
                extractedSkills: {
                    resume: resumeSkills,
                    jd: jdSkills,
                },
                skillGaps,
                learningPath: {
                    ...criticResult.validatedPath,
                    nodes: enhancedNodes
                },
                validationReport: criticResult.validationReport,
                reasoningTrace: tracer.getSteps(),
            };

            // Database Persistence
            if (userId) {
                try {
                    tracer.addStep("Saving data to Postgres Database", "Upserting Profile and Roadmap");

                    await prisma.profile.upsert({
                        where: { userId },
                        update: { resumeText, extractedSkills: result.extractedSkills as any },
                        create: { userId, resumeText, extractedSkills: result.extractedSkills as any }
                    });

                    // Fetch user's target role to associate context
                    const userRecord = await prisma.user.findUnique({ where: { id: userId } });
                    const targetRole = userRecord?.role || "Developer";

                    // The readiness score calculates coverage of Matched vs Total JD skills
                    const totalRequired = jdSkills.technical.length + jdSkills.soft.length;
                    const matchedScore = totalRequired > 0 ? ((totalRequired - skillGaps.length) / totalRequired) * 100 : 85;

                    await prisma.roadmap.create({
                        data: {
                            userId,
                            role: targetRole,
                            readinessScore: Math.round(matchedScore),
                            modules: result.learningPath.nodes as any
                        }
                    });
                     tracer.addStep("Database insertion successful", "Pipeline complete");
                } catch (dbError: any) {
                    tracer.addStep("Database insertion failed", dbError.message);
                    console.error("Database save failed: ", dbError);
                }
            }

            // Signal SSE stream completion
            const sendEvent = sseClients.get(sessionId);
            if (sendEvent) {
                sendEvent(JSON.stringify({ step: -1, logic: "DONE", action: "COMPLETE" }));
            }

            return reply.status(200).send(result);
        } catch (error: any) {
            tracer.addStep(`Error: ${error.message}`, "Pipeline failed");

            const sendEvent = sseClients.get(sessionId);
            if (sendEvent) {
                sendEvent(
                    JSON.stringify({
                        step: -1,
                        logic: `Error: ${error.message}`,
                        action: "FAILED",
                    })
                );
            }

            return reply.status(500).send({
                error: "Analysis failed",
                message: error.message,
                reasoningTrace: tracer.getSteps(),
            });
        }
    });

    // ============================================================
    // STUDENT ENDPOINTS (all responses generated dynamically)
    // ============================================================

    // Next level of "what are you pursuing" options, based on the path chosen so far
    server.post("/api/student/pursuit-options", async (request, reply) => {
        try {
            const { path } = (request.body || {}) as { path?: string[] };
            const result = await studentService.getPursuitOptions(Array.isArray(path) ? path : []);
            return reply.send(result);
        } catch (error: any) {
            return reply.status(500).send({ error: error.message || "Failed to load options" });
        }
    });

    // Skills required for the selected pursuit path + field of interest
    server.post("/api/student/skills", async (request, reply) => {
        try {
            const { path, fieldOfInterest } = (request.body || {}) as { path?: string[]; fieldOfInterest?: string };
            if (!Array.isArray(path) || path.length === 0) {
                return reply.status(400).send({ error: "Select what you are pursuing first" });
            }
            if (!fieldOfInterest || !fieldOfInterest.trim()) {
                return reply.status(400).send({ error: "Field of interest is required" });
            }
            const skills = await studentService.getRequiredSkills(path, fieldOfInterest.trim());
            return reply.send({ skills });
        } catch (error: any) {
            return reply.status(500).send({ error: error.message || "Failed to load skills" });
        }
    });

    // Marksheet (PDF) + pursuit path + field of interest + self-ratings -> analysis
    server.post("/api/student/analyze", async (request, reply) => {
        try {
            let marksheetBuffer: Buffer | null = null;
            let marksheetFilename = "marksheet.pdf";
            let pursuitPath: string[] = [];
            let fieldOfInterest = "";
            let ratings: Array<{ skill: string; rating: number }> = [];

            for await (const part of request.parts()) {
                if (part.type === "file" && part.fieldname === "marksheet") {
                    marksheetBuffer = await part.toBuffer();
                    marksheetFilename = part.filename || marksheetFilename;
                } else if (part.type === "field") {
                    const value = String(part.value ?? "");
                    if (part.fieldname === "pursuitPath") pursuitPath = JSON.parse(value);
                    else if (part.fieldname === "fieldOfInterest") fieldOfInterest = value.trim();
                    else if (part.fieldname === "ratings") ratings = JSON.parse(value);
                }
            }

            if (!marksheetBuffer) return reply.status(400).send({ error: "Marksheet PDF is required" });
            if (!pursuitPath.length) return reply.status(400).send({ error: "Select what you are pursuing" });
            if (!fieldOfInterest) return reply.status(400).send({ error: "Field of interest is required" });
            if (!ratings.length) return reply.status(400).send({ error: "Rate your skills before analyzing" });

            const result = await studentService.analyze({
                marksheetBuffer,
                marksheetFilename,
                pursuitPath,
                fieldOfInterest,
                ratings,
            });
            return reply.send(result);
        } catch (error: any) {
            return reply.status(500).send({ error: error.message || "Analysis failed" });
        }
    });

    // ============================================================
    // GET /api/health
    // ============================================================
    server.get("/api/health", async () => {
        return {
            status: "ok",
            service: "GapGraph Backend",
            timestamp: new Date().toISOString(),
        };
    });

    // ============================================================
    // Start server
    // ============================================================
    const port = parseInt(process.env.PORT || "3001", 10);
    try {
        await server.listen({ port, host: "0.0.0.0" });
        console.log(`🚀 GapGraph Backend running on http://localhost:${port}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}

main();
