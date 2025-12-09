'use client';

import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import Image from 'next/image';
import { useState } from 'react';
import CodeBlock from './CodeBlock';

interface LandingPageProps {
    onNavigateToDashboard: () => void;
}

const features = [
    {
        icon: 'material-symbols:search',
        title: 'Semantic Search',
        description: 'Vector similarity search for finding relevant messages using advanced embeddings and similarity algorithms.'
    },
    {
        icon: 'material-symbols:schedule',
        title: 'Async Embeddings',
        description: 'Background job processing for embeddings ensures fast response times without blocking your application flow.'
    },
    {
        icon: 'material-symbols:star',
        title: 'Importance Scoring',
        description: 'Automatic message importance calculation helps prioritize and surface the most relevant information first.'
    },
    {
        icon: 'material-symbols:auto-delete',
        title: 'Auto Retention',
        description: 'Configurable policies for archiving and deleting old messages to keep your storage optimized and costs low.'
    },
    {
        icon: 'material-symbols:business',
        title: 'Enterprise Ready',
        description: 'API authentication, rate limiting, multi-tenancy, and comprehensive metrics for production deployments.'
    },
    {
        icon: 'material-symbols:integration-instructions',
        title: 'Easy Integration',
        description: 'REST API with SDKs for multiple languages makes integration simple and developer-friendly.'
    }
];

const techStack = [
    { name: 'FastAPI', icon: 'simple-icons:fastapi' },
    { name: 'PostgreSQL', icon: 'simple-icons:postgresql' },
    { name: 'Redis', icon: 'simple-icons:redis' },
    { name: 'Docker', icon: 'simple-icons:docker' },
    { name: 'Python', icon: 'simple-icons:python' },
    { name: 'Prometheus', icon: 'simple-icons:prometheus' }
];

const codeExamples = {
    curl: `curl -X POST http://localhost:8000/v1/messages \\
  -H "x-api-key: your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "tenant_id": "your-tenant",
    "conversation_id": "conversation-1",
    "role": "user",
    "content": "How does vector similarity work?"
  }'`,
    python: `import requests

# Store a message
response = requests.post(
    'http://localhost:8000/v1/messages',
    headers={'x-api-key': 'your-api-key'},
    json={
        'tenant_id': 'your-tenant',
        'conversation_id': 'conversation-1',
        'role': 'user',
        'content': 'How does vector similarity work?'
    }
)

# Search memories
search_response = requests.get(
    'http://localhost:8000/v1/memory/search',
    headers={'x-api-key': 'your-api-key'},
    params={
        'query': 'vector similarity',
        'tenant_id': 'your-tenant',
        'top_k': 5
    }
)`,
    javascript: `const API_BASE = 'http://localhost:8000';
const headers = {
  'x-api-key': 'your-api-key',
  'Content-Type': 'application/json'
};

// Store a message
const storeMessage = await fetch(\`\${API_BASE}/v1/messages\`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    tenant_id: 'your-tenant',
    conversation_id: 'conversation-1',
    role: 'user',
    content: 'How does vector similarity work?'
  })
});

// Search memories
const searchMemories = await fetch(
  \`\${API_BASE}/v1/memory/search?query=vector%20similarity&tenant_id=your-tenant&top_k=5\`,
  { headers }
);`,
    go: `package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

type Message struct {
    TenantID       string \`json:"tenant_id"\`
    ConversationID string \`json:"conversation_id"\`
    Role          string \`json:"role"\`
    Content       string \`json:"content"\`
}

func storeMessage() {
    msg := Message{
        TenantID:       "your-tenant",
        ConversationID: "conversation-1",
        Role:          "user",
        Content:       "How does vector similarity work?",
    }
    
    jsonData, _ := json.Marshal(msg)
    req, _ := http.NewRequest("POST", 
        "http://localhost:8000/v1/messages", 
        bytes.NewBuffer(jsonData))
    
    req.Header.Set("x-api-key", "your-api-key")
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
}`
};

export default function LandingPage({ onNavigateToDashboard }: LandingPageProps) {
    const [activeCodeTab, setActiveCodeTab] = useState('curl');

    return (
        <div className="min-h-screen bg-[var(--background)]">
            {/* Hero Section */}
            <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8" aria-labelledby="hero-heading">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="max-w-4xl mx-auto rounded-2xl border border-[var(--border)] bg-[rgb(var(--surface-rgb)/0.5)] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] px-6 sm:px-10 py-10"
                        >
                            <h1 id="hero-heading" className="text-5xl md:text-7xl font-light text-[var(--text)] mb-6 leading-tight">
                                <span>Semantic Memory</span>
                                <br />
                                <span>for AI Systems</span>
                            </h1>

                            <p className="text-xl text-[var(--muted-text)] mb-8 max-w-2xl mx-auto leading-relaxed">
                                <span>Store, search, and manage conversational memories with vector embeddings, </span>
                                <span>importance scoring, and automated retention policies.</span>
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                <button
                                    onClick={onNavigateToDashboard}
                                    className="bg-[var(--accent)] text-[var(--surface)] px-8 py-3 rounded-lg text-lg font-medium hover:opacity-90 transition-opacity flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                                    aria-label="Try Dashboard"
                                >
                                    <Icon icon="material-symbols:api" className="w-5 h-5" />
                                    <span>Try Dashboard</span>
                                </button>

                                <a
                                    href="https://github.com/shubhhh19/memory-layer"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="border border-[var(--border)] text-[var(--text)] px-8 py-3 rounded-lg text-lg font-medium hover:bg-[rgb(var(--surface-rgb)/0.4)] backdrop-blur-xl transition-colors flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                                    aria-label="View on GitHub"
                                >
                                    <Icon icon="mdi:github" className="w-5 h-5" />
                                    <span>View on GitHub</span>
                                </a>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Code Example Section */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[var(--background)]" aria-labelledby="quickstart-heading">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-8"
                    >
                        <h2 id="quickstart-heading" className="text-3xl font-light text-[var(--text)] mb-4">
                            <span>Get Started in Seconds</span>
                        </h2>
                        <p className="text-[var(--muted-text)]">
                            <span>Simple REST API for storing and searching semantic memories</span>
                        </p>
                    </motion.div>

                    <CodeBlock
                        code={codeExamples.curl}
                        language="bash"
                        title="Quick Start Example"
                    />
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8" aria-labelledby="features-heading">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-16"
                    >
                        <h2 id="features-heading" className="text-4xl font-light text-[var(--text)] mb-4">
                            <span>Built for Scale</span>
                        </h2>
                        <p className="text-xl text-[var(--muted-text)] max-w-2xl mx-auto">
                            <span>Everything you need to add semantic memory capabilities to your AI applications</span>
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: index * 0.1 }}
                                className="rounded-2xl p-6 border border-[var(--border)] bg-[rgb(var(--surface-rgb)/0.55)] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-shadow"
                            >
                                <div className="flex items-center mb-4">
                                    <div className="p-2 bg-[rgb(var(--surface-rgb)/0.5)] backdrop-blur-xl rounded-lg mr-4 border border-[var(--border)]">
                                        <Icon icon={feature.icon} className="w-6 h-6 text-[var(--accent)]" />
                                    </div>
                                    <h3 className="text-xl font-medium text-[var(--text)]">{feature.title}</h3>
                                </div>
                                <p className="text-[var(--muted-text)] text-sm leading-relaxed">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[var(--background)]" aria-labelledby="how-heading">
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-16"
                    >
                        <h2 id="how-heading" className="text-4xl font-light text-[var(--text)] mb-4">
                            <span>How It Works</span>
                        </h2>
                        <p className="text-xl text-[var(--muted-text)]">
                            <span>Three simple steps to semantic memory</span>
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                step: '01',
                                title: 'Store',
                                description: 'Messages are automatically processed with vector embeddings and importance scoring.',
                                icon: 'material-symbols:storage'
                            },
                            {
                                step: '02',
                                title: 'Search',
                                description: 'Query using semantic similarity to find the most relevant memories across conversations.',
                                icon: 'material-symbols:search'
                            },
                            {
                                step: '03',
                                title: 'Manage',
                                description: 'Automated retention policies keep your memory store optimized and cost-effective.',
                                icon: 'material-symbols:settings'
                            }
                        ].map((item, index) => (
                            <motion.div
                                key={item.step}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: index * 0.2 }}
                                className="text-center"
                            >
                                <div className="relative mb-6">
                                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--border)] bg-[rgb(var(--surface-rgb)/0.6)] backdrop-blur-xl">
                                        <Icon icon={item.icon} className="w-8 h-8 text-[var(--accent)]" />
                                    </div>
                                    <div className="text-sm font-medium text-[var(--muted-text)] mb-2">{item.step}</div>
                                </div>
                                <h3 className="text-2xl font-medium text-[var(--text)] mb-4">{item.title}</h3>
                                <p className="text-[var(--muted-text)] text-sm leading-relaxed">{item.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Tech Stack Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8" aria-labelledby="stack-heading">
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-12"
                    >
                        <h2 id="stack-heading" className="text-4xl font-light text-[var(--text)] mb-4">
                            <span>Built with Modern Stack</span>
                        </h2>
                        <p className="text-xl text-[var(--muted-text)]">
                            <span>Production-ready technologies for reliability and scale</span>
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
                        {techStack.map((tech, index) => (
                            <motion.div
                                key={tech.name}
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="text-center"
                            >
                                <div className="p-4 rounded-lg border border-[var(--border)] mb-3 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-shadow bg-[rgb(var(--surface-rgb)/0.55)] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
                                    <Icon icon={tech.icon} className="w-8 h-8 mx-auto text-[var(--accent)]" />
                                </div>
                                <p className="text-sm font-medium text-[var(--muted-text)]">{tech.name}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Quick Start Code Examples */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[var(--background)]" aria-labelledby="langs-heading">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-12"
                    >
                        <h2 id="langs-heading" className="text-4xl font-light text-[var(--text)] mb-4">
                            <span>Multiple Language Support</span>
                        </h2>
                        <p className="text-xl text-[var(--muted-text)]">
                            <span>Start building with your preferred language and framework</span>
                        </p>
                    </motion.div>

                    <div className="mb-8">
                        <div className="flex flex-wrap justify-center gap-2" role="tablist" aria-label="Code language selector">
                            {Object.entries(codeExamples).map(([key]) => (
                                <button
                                    key={key}
                                    onClick={() => setActiveCodeTab(key)}
                                    role="tab"
                                    aria-selected={activeCodeTab === key}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${activeCodeTab === key
                                        ? 'bg-[var(--accent)] text-[var(--surface)]'
                                        : 'bg-[rgb(var(--surface-rgb)/0.6)] backdrop-blur-xl text-[var(--muted-text)] border border-[var(--border)] hover:bg-[rgb(var(--surface-rgb)/0.5)]'
                                        }`}
                                >
                                    {key === 'curl' ? 'cURL' : key === 'javascript' ? 'JavaScript' : key.charAt(0).toUpperCase() + key.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <CodeBlock
                        code={codeExamples[activeCodeTab as keyof typeof codeExamples]}
                        language={activeCodeTab === 'curl' ? 'bash' : activeCodeTab === 'javascript' ? 'javascript' : activeCodeTab}
                        showLineNumbers
                    />
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-[rgb(var(--surface-rgb)/0.6)] backdrop-blur-xl border-t border-[var(--border)]">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2">
                            <div className="flex items-center space-x-3 mb-4">
                                <img src="/logo-icon.png" alt="Memory Mesh Logo" width={32} height={32} className="w-8 h-8" />
                                <h3 className="text-xl font-medium text-[var(--text)]">Memory Mesh</h3>
                            </div>
                            <p className="text-[var(--muted-text)] text-sm mb-6">
                                <span>Semantic memory infrastructure for next-generation AI applications. </span>
                                <span>Store, search, and manage conversational memories at scale.</span>
                            </p>
                            <p className="text-[var(--muted-text)] text-xs mb-2">
                                <span>© 2025 Memory Mesh. Open source project.</span>
                            </p>
                            <p className="text-[var(--muted-text)] text-xs">
                                <span>Made by </span>
                                <a
                                    href="https://shubhsoni.com/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[var(--accent)] hover:underline"
                                >
                                    Shubh Soni
                                </a>
                            </p>
                        </div>

                        <div>
                            <h4 className="text-sm font-medium mb-4 text-[var(--text)]">Connect</h4>
                            <ul className="space-y-2 text-sm text-[var(--muted-text)]">
                                <li>
                                    <a href="https://github.com/shubhhh19/memory-layer" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text)] transition-colors">
                                        <span>GitHub</span>
                                    </a>
                                </li>
                                <li>
                                    <a href="https://shubhsoni.com/" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text)] transition-colors">
                                        <span>Creator&apos;s Website</span>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}