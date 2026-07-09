# Mnemo

**Your documents, remembered.** A full-stack Retrieval-Augmented Generation (RAG) application that lets you upload documents once and have persistent, context-aware conversations about them — across any chat, any time.

Built solo, end-to-end, and deployed to production in under three weeks.

🔗 **Live:** [mnemo.bakarqureshi.dev](https://mnemo.bakarqureshi.dev)

---

## What it does

Most AI chat tools treat your uploaded documents as disposable — tied to a single conversation, gone the moment you start a new one. Mnemo fixes that:

- Upload documents once into a **project**
- Every chat inside that project shares the same knowledge base
- Ask questions in any chat, get answers grounded in your actual uploaded content
- No re-uploading, no lost context, no black box — the retrieval pipeline is yours

## Features

- 🔐 Custom authentication with JWT + bcrypt, httpOnly cookies for XSS-resistant sessions
- 📁 Project-based organization — documents persist across all chats within a project
- 📄 Multi-format document upload (PDF, DOCX, TXT, and more)
- 🔍 Semantic search over your documents via vector embeddings
- 💬 Streaming chat responses grounded in retrieved context
- 🧠 Multi-turn conversation memory within and across sessions

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│  React      │────▶│   FastAPI     │────▶│  LangGraph  │
│ (Vite)      │      │   Backend    │      │Orchestration│
│S3/CloudFront│◀────│   (EC2)       │◀────│             │
└─────────────┘      └──────┬───────┘      └──────┬──────┘
                            │                     │
                            ▼                     ▼
                      ┌─────────────┐       ┌───────────────┐
                      │  PostgreSQL │       │     Groq      │
                      │  + pgvector │       │(LLM inference)│
                      │    (RDS)    │       └───────────────┘
                      └─────────────┘
```

**Flow:** Documents are chunked and embedded on upload, then stored in Postgres with `pgvector` (HNSW indexing). On each query, relevant chunks are retrieved via vector similarity search, LangGraph orchestrates the conversation and tool calls, and Groq generates the final grounded response.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, deployed on S3 + CloudFront |
| Backend | FastAPI, async SQLAlchemy ORM |
| Orchestration | LangGraph |
| Vector store | PostgreSQL + pgvector (HNSW index) |
| LLM inference | Groq |
| Auth | JWT, bcrypt, httpOnly cookies |
| Infrastructure | AWS EC2 (Nginx + Let's Encrypt), RDS, S3, CloudFront |

## Getting Started

### Prerequisites
- Python 3.12+
- Node.js 22+
- PostgreSQL 18+ with the `pgvector` extension enabled
- A Groq API key

## Deployment

Mnemo runs on AWS:
- **Backend** — FastAPI on an EC2 instance, reverse-proxied through Nginx with Let's Encrypt SSL
- **Database** — Managed PostgreSQL on RDS with `pgvector` enabled
- **Frontend** — Static React build hosted on S3, served through CloudFront

## Known limitations / roadmap

- [ ] Configurable chunking strategy per document type
- [ ] Support for additional file formats
- [ ] Usage-based rate limiting per user
- [ ] Admin dashboard for monitoring retrieval quality

## License

[MIT](LICENSE)

## Author

Built by **Bakar Qureshi** — [bakarqureshi.dev](https://bakarqureshi.dev)
