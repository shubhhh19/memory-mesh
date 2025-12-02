# Integration Guide

This guide shows you how to connect your application to the AI Memory Layer service.

## Quick Start

### 1. Get Your API Key

First, obtain an API key from your service administrator. The API key is required for all authenticated endpoints.

### 2. Base URL

- **Development:** `http://localhost:8000`
- **Production:** `https://your-memory-service.com`

### 3. Authentication

Include your API key in the `x-api-key` header for all requests:

```http
x-api-key: your-api-key-here
```

---

## Common Integration Patterns

### Pattern 1: Chatbot with Memory

Store user messages and assistant responses, then search for relevant context before generating responses.

### Pattern 2: Customer Support System

Store support conversations and search for similar past issues to provide faster resolutions.

### Pattern 3: AI Assistant

Remember user preferences and past conversations to provide personalized responses.

---

## API Endpoints

### Store a Message

**Endpoint:** `POST /v1/messages`

Store a conversation message with automatic embedding generation.

### Retrieve a Message

**Endpoint:** `GET /v1/messages/{message_id}`

Get a specific message by its UUID.

### Search Memories

**Endpoint:** `GET /v1/memory/search`

Search for relevant past messages using semantic similarity.

### Health Check

**Endpoint:** `GET /v1/admin/health`

Check if the service is running (no authentication required).

---

## Integration Examples

### Python

#### Basic Client Class

```python
import requests
from typing import Optional, List, Dict, Any
from uuid import UUID

class MemoryLayerClient:
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.headers = {
            "x-api-key": api_key,
            "Content-Type": "application/json"
        }
    
    def store_message(
        self,
        tenant_id: str,
        conversation_id: str,
        role: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None,
        importance_override: Optional[float] = None
    ) -> Dict[str, Any]:
        """Store a message in the memory layer."""
        url = f"{self.base_url}/v1/messages"
        payload = {
            "tenant_id": tenant_id,
            "conversation_id": conversation_id,
            "role": role,
            "content": content,
            "metadata": metadata or {},
        }
        if importance_override is not None:
            payload["importance_override"] = importance_override
        
        response = requests.post(url, json=payload, headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def get_message(self, message_id: UUID) -> Dict[str, Any]:
        """Retrieve a message by ID."""
        url = f"{self.base_url}/v1/messages/{message_id}"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def search_memories(
        self,
        tenant_id: str,
        query: str,
        conversation_id: Optional[str] = None,
        top_k: int = 5,
        importance_min: Optional[float] = None
    ) -> Dict[str, Any]:
        """Search for relevant memories."""
        url = f"{self.base_url}/v1/memory/search"
        params = {
            "tenant_id": tenant_id,
            "query": query,
            "top_k": top_k,
        }
        if conversation_id:
            params["conversation_id"] = conversation_id
        if importance_min is not None:
            params["importance_min"] = importance_min
        
        response = requests.get(url, params=params, headers=self.headers)
        response.raise_for_status()
        return response.json()

# Usage
client = MemoryLayerClient(
    base_url="http://localhost:8000",
    api_key="your-api-key-here"
)

# Store a user message
message = client.store_message(
    tenant_id="my-app",
    conversation_id="user-123",
    role="user",
    content="I love Python programming",
    metadata={"channel": "web"}
)
print(f"Stored message: {message['id']}")

# Search for relevant memories
results = client.search_memories(
    tenant_id="my-app",
    query="Python programming",
    top_k=5
)
for item in results["items"]:
    print(f"Found: {item['content']} (score: {item['score']})")
```

#### Chatbot Integration Example

```python
class ChatbotWithMemory:
    def __init__(self, memory_client: MemoryLayerClient, tenant_id: str):
        self.memory = memory_client
        self.tenant_id = tenant_id
    
    def handle_message(self, conversation_id: str, user_message: str) -> str:
        # Store user message
        user_msg = self.memory.store_message(
            tenant_id=self.tenant_id,
            conversation_id=conversation_id,
            role="user",
            content=user_message
        )
        
        # Search for relevant context
        context = self.memory.search_memories(
            tenant_id=self.tenant_id,
            conversation_id=conversation_id,
            query=user_message,
            top_k=3
        )
        
        # Build context from search results
        context_text = "\n".join([
            f"Previous: {item['content']}"
            for item in context["items"]
        ])
        
        # Generate response (using your LLM)
        assistant_response = self.generate_response(
            user_message=user_message,
            context=context_text
        )
        
        # Store assistant response
        self.memory.store_message(
            tenant_id=self.tenant_id,
            conversation_id=conversation_id,
            role="assistant",
            content=assistant_response
        )
        
        return assistant_response
    
    def generate_response(self, user_message: str, context: str) -> str:
        # Your LLM integration here
        # Use context to provide better responses
        pass

# Usage
memory_client = MemoryLayerClient(
    base_url="http://localhost:8000",
    api_key="your-api-key"
)

chatbot = ChatbotWithMemory(memory_client, tenant_id="my-app")
response = chatbot.handle_message("user-123", "Tell me about Python")
print(response)
```

---

### JavaScript/TypeScript

#### Basic Client Class

```typescript
interface MessageCreate {
  tenant_id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: Record<string, any>;
  importance_override?: number;
}

interface MessageResponse {
  id: string;
  tenant_id: string;
  conversation_id: string;
  role: string;
  content: string;
  metadata: Record<string, any>;
  importance_score: number | null;
  embedding_status: string;
  created_at: string;
  updated_at: string;
}

interface SearchResponse {
  total: number;
  items: Array<{
    message_id: string;
    score: number;
    similarity: number;
    decay: number;
    content: string;
    role: string;
    metadata: Record<string, any>;
    created_at: string;
    importance: number | null;
  }>;
}

class MemoryLayerClient {
  private baseUrl: string;
  private apiKey: string;
  private headers: HeadersInit;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
    this.headers = {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    };
  }

  async storeMessage(data: MessageCreate): Promise<MessageResponse> {
    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to store message: ${response.statusText}`);
    }

    return response.json();
  }

  async getMessage(messageId: string): Promise<MessageResponse> {
    const response = await fetch(
      `${this.baseUrl}/v1/messages/${messageId}`,
      {
        headers: this.headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get message: ${response.statusText}`);
    }

    return response.json();
  }

  async searchMemories(
    tenantId: string,
    query: string,
    options?: {
      conversationId?: string;
      topK?: number;
      importanceMin?: number;
    }
  ): Promise<SearchResponse> {
    const params = new URLSearchParams({
      tenant_id: tenantId,
      query: query,
      top_k: String(options?.topK || 5),
    });

    if (options?.conversationId) {
      params.append('conversation_id', options.conversationId);
    }
    if (options?.importanceMin !== undefined) {
      params.append('importance_min', String(options.importanceMin));
    }

    const response = await fetch(
      `${this.baseUrl}/v1/memory/search?${params}`,
      {
        headers: this.headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to search: ${response.statusText}`);
    }

    return response.json();
  }
}

// Usage
const client = new MemoryLayerClient(
  'http://localhost:8000',
  'your-api-key-here'
);

// Store a message
const message = await client.storeMessage({
  tenant_id: 'my-app',
  conversation_id: 'user-123',
  role: 'user',
  content: 'I love TypeScript',
  metadata: { channel: 'web' },
});

console.log('Stored message:', message.id);

// Search memories
const results = await client.searchMemories('my-app', 'TypeScript', {
  topK: 5,
});

results.items.forEach((item) => {
  console.log(`Found: ${item.content} (score: ${item.score})`);
});
```

#### React Hook Example

```typescript
import { useState, useCallback } from 'react';

function useMemoryLayer(baseUrl: string, apiKey: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const storeMessage = useCallback(async (data: MessageCreate) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(response.statusText);
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [baseUrl, apiKey]);

  const searchMemories = useCallback(async (
    tenantId: string,
    query: string,
    options?: { conversationId?: string; topK?: number }
  ) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        tenant_id: tenantId,
        query: query,
        top_k: String(options?.topK || 5),
      });
      if (options?.conversationId) {
        params.append('conversation_id', options.conversationId);
      }
      const response = await fetch(
        `${baseUrl}/v1/memory/search?${params}`,
        {
          headers: { 'x-api-key': apiKey },
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [baseUrl, apiKey]);

  return { storeMessage, searchMemories, loading, error };
}

// Usage in component
function ChatComponent() {
  const { storeMessage, searchMemories, loading } = useMemoryLayer(
    'http://localhost:8000',
    'your-api-key'
  );

  const handleSend = async (message: string) => {
    // Store user message
    await storeMessage({
      tenant_id: 'my-app',
      conversation_id: 'user-123',
      role: 'user',
      content: message,
    });

    // Search for context
    const context = await searchMemories('my-app', message, {
      conversationId: 'user-123',
      topK: 3,
    });

    // Use context to generate response
    console.log('Context:', context);
  };

  return <div>...</div>;
}
```

---

### cURL Examples

#### Store a Message

```bash
curl -X POST http://localhost:8000/v1/messages \
  -H "x-api-key: your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "my-app",
    "conversation_id": "user-123",
    "role": "user",
    "content": "I love Python programming",
    "metadata": {"channel": "web"}
  }'
```

#### Search Memories

```bash
curl "http://localhost:8000/v1/memory/search?tenant_id=my-app&query=Python&top_k=5" \
  -H "x-api-key: your-api-key-here"
```

#### Get Message by ID

```bash
curl "http://localhost:8000/v1/messages/123e4567-e89b-12d3-a456-426614174000" \
  -H "x-api-key: your-api-key-here"
```

---

### Go

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

type MemoryLayerClient struct {
    BaseURL string
    APIKey  string
}

type MessageCreate struct {
    TenantID          string                 `json:"tenant_id"`
    ConversationID    string                 `json:"conversation_id"`
    Role              string                 `json:"role"`
    Content           string                 `json:"content"`
    Metadata         map[string]interface{} `json:"metadata,omitempty"`
    ImportanceOverride *float64              `json:"importance_override,omitempty"`
}

type MessageResponse struct {
    ID              string                 `json:"id"`
    TenantID        string                 `json:"tenant_id"`
    ConversationID string                 `json:"conversation_id"`
    Role            string                 `json:"role"`
    Content         string                 `json:"content"`
    Metadata        map[string]interface{} `json:"metadata"`
    ImportanceScore *float64               `json:"importance_score"`
    EmbeddingStatus string                 `json:"embedding_status"`
    CreatedAt       string                 `json:"created_at"`
    UpdatedAt       string                 `json:"updated_at"`
}

func (c *MemoryLayerClient) StoreMessage(msg MessageCreate) (*MessageResponse, error) {
    jsonData, err := json.Marshal(msg)
    if err != nil {
        return nil, err
    }

    req, err := http.NewRequest("POST", c.BaseURL+"/v1/messages", bytes.NewBuffer(jsonData))
    if err != nil {
        return nil, err
    }

    req.Header.Set("x-api-key", c.APIKey)
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusAccepted {
        body, _ := io.ReadAll(resp.Body)
        return nil, fmt.Errorf("API error: %s", string(body))
    }

    var message MessageResponse
    if err := json.NewDecoder(resp.Body).Decode(&message); err != nil {
        return nil, err
    }

    return &message, nil
}

// Usage
func main() {
    client := &MemoryLayerClient{
        BaseURL: "http://localhost:8000",
        APIKey:  "your-api-key-here",
    }

    message, err := client.StoreMessage(MessageCreate{
        TenantID:       "my-app",
        ConversationID:  "user-123",
        Role:           "user",
        Content:        "I love Go programming",
    })

    if err != nil {
        fmt.Printf("Error: %v\n", err)
        return
    }

    fmt.Printf("Stored message: %s\n", message.ID)
}
```

---

## Error Handling

### Common HTTP Status Codes

- **200 OK**: Request successful
- **202 Accepted**: Message stored, embedding processing in background
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Missing or invalid API key
- **404 Not Found**: Message not found
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

### Python Error Handling Example

```python
import requests
from requests.exceptions import RequestException

try:
    response = client.store_message(...)
except requests.exceptions.HTTPError as e:
    if e.response.status_code == 401:
        print("Invalid API key")
    elif e.response.status_code == 429:
        print("Rate limit exceeded")
        retry_after = e.response.headers.get('Retry-After')
        print(f"Retry after {retry_after} seconds")
    else:
        print(f"HTTP error: {e}")
except RequestException as e:
    print(f"Request failed: {e}")
```

---

## Best Practices

### 1. Tenant ID Strategy

Use a consistent tenant ID format:
- **Single Application**: Use your app name (e.g., `"my-chatbot"`)
- **Multi-tenant SaaS**: Use user/organization IDs (e.g., `"org-123"`)
- **Development**: Use environment-specific IDs (e.g., `"dev-app"`)

### 2. Conversation ID Strategy

- **Per User**: Use user ID (e.g., `"user-123"`)
- **Per Session**: Use session ID (e.g., `"session-abc"`)
- **Per Thread**: Use thread/topic ID (e.g., `"thread-xyz"`)

### 3. Message Storage

```python
# Store both user and assistant messages
client.store_message(
    tenant_id="my-app",
    conversation_id="user-123",
    role="user",
    content=user_message
)

client.store_message(
    tenant_id="my-app",
    conversation_id="user-123",
    role="assistant",
    content=assistant_response
)
```

### 4. Search Optimization

- Use `conversation_id` to limit search to specific conversations
- Set `importance_min` to filter low-importance messages
- Adjust `top_k` based on your use case (3-10 is usually optimal)

### 5. Async Embeddings

If using async embeddings (`MEMORY_ASYNC_EMBEDDINGS=true`):
- Messages return `202 Accepted` immediately
- Embeddings are processed in background
- Search may not find messages until embeddings complete
- Poll message status or wait before searching

### 6. Rate Limiting

The service enforces rate limits. Check response headers:
- `X-RateLimit-Limit`: Maximum requests per window
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: When the limit resets
- `Retry-After`: Seconds to wait (when rate limited)

---

## Complete Integration Example

### Python Chatbot with Memory

```python
import requests
from typing import List, Dict, Any

class Chatbot:
    def __init__(self, memory_url: str, api_key: str, tenant_id: str):
        self.memory_url = memory_url
        self.api_key = api_key
        self.tenant_id = tenant_id
        self.headers = {
            "x-api-key": api_key,
            "Content-Type": "application/json"
        }
    
    def chat(self, user_id: str, message: str) -> str:
        conversation_id = f"user-{user_id}"
        
        # 1. Store user message
        user_msg = self._store_message(
            conversation_id=conversation_id,
            role="user",
            content=message
        )
        
        # 2. Search for relevant context
        context = self._search_memories(
            conversation_id=conversation_id,
            query=message,
            top_k=5
        )
        
        # 3. Build context string
        context_messages = [
            f"{item['role']}: {item['content']}"
            for item in context["items"]
        ]
        
        # 4. Generate response (using your LLM)
        response = self._generate_response(
            user_message=message,
            context="\n".join(context_messages)
        )
        
        # 5. Store assistant response
        self._store_message(
            conversation_id=conversation_id,
            role="assistant",
            content=response
        )
        
        return response
    
    def _store_message(self, conversation_id: str, role: str, content: str):
        response = requests.post(
            f"{self.memory_url}/v1/messages",
            json={
                "tenant_id": self.tenant_id,
                "conversation_id": conversation_id,
                "role": role,
                "content": content
            },
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def _search_memories(self, conversation_id: str, query: str, top_k: int):
        response = requests.get(
            f"{self.memory_url}/v1/memory/search",
            params={
                "tenant_id": self.tenant_id,
                "conversation_id": conversation_id,
                "query": query,
                "top_k": top_k
            },
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def _generate_response(self, user_message: str, context: str) -> str:
        # Integrate with your LLM (OpenAI, Anthropic, etc.)
        # Use context to provide better responses
        pass

# Usage
chatbot = Chatbot(
    memory_url="http://localhost:8000",
    api_key="your-api-key",
    tenant_id="my-app"
)

response = chatbot.chat("user-123", "What did we talk about earlier?")
print(response)
```

---

## Testing Your Integration

### 1. Health Check

```bash
curl http://localhost:8000/v1/admin/health
```

### 2. Test Authentication

```bash
# Should fail without API key
curl -X POST http://localhost:8000/v1/messages \
  -H "Content-Type: application/json" \
  -d '{"tenant_id":"test","conversation_id":"c1","role":"user","content":"test"}'

# Should succeed with API key
curl -X POST http://localhost:8000/v1/messages \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id":"test","conversation_id":"c1","role":"user","content":"test"}'
```

### 3. Test Full Flow

```python
# 1. Store a message
message = client.store_message(...)

# 2. Wait a moment for embedding (if async)
import time
time.sleep(2)

# 3. Search for it
results = client.search_memories(..., query="similar text")

# 4. Verify results
assert len(results["items"]) > 0
```

---

## API Documentation

Interactive API documentation is available at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI JSON**: `http://localhost:8000/openapi.json`

---

## Support

For issues or questions:
1. Check the API documentation at `/docs`
2. Review error messages in responses
3. Check service health at `/v1/admin/health`
4. Review logs for detailed error information

