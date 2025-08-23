```mermaid
flowchart TD
    A[User Query Input] --> B{RAG Service<br/>Initialized?}
    B -->|No| C[Initialize RAG Service]
    B -->|Yes| D[Mode Detection]
    
    C --> C1[Load Knowledge Base<br/>JSON File]
    C1 --> C2[Create LangChain Documents]
    C2 --> C3[Generate Embeddings<br/>OpenAI text-embedding-3-small]
    C3 --> C4[Build Vector Store<br/>MemoryVectorStore]
    C4 --> C5[Create Retriever<br/>k=3 documents]
    C5 --> C6[Setup RAG Chain<br/>RunnableSequence]
    C6 --> D
    
    D --> E{Query Classification}
    E -->|Function Calling Keywords<br/>phát âm, dịch, quiz| F[English Practice Mode]
    E -->|FAQ Keywords<br/>giá cả, lộ trình, liên hệ| G[FAQ Mode]
    E -->|Regex Patterns<br/>lộ trình.*người mới| G
    E -->|Explicit Mode| H{Explicit Mode?}
    H -->|faq| G
    H -->|practice| F
    
    %% FAQ Mode Branch
    G --> G1[Process FAQ Query]
    G1 --> G2[Execute RAG Chain]
    G2 --> G21[Vector Search<br/>Find Relevant Docs]
    G21 --> G22[Context Injection<br/>Top 3 Documents]
    G22 --> G23[Prompt Template<br/>+ Context + Question]
    G23 --> G24[LLM Generation<br/>ChatOpenAI GPT-4o-mini]
    G24 --> G25[Parse Response<br/>StringOutputParser]
    G25 --> G3[Get Source Documents]
    G3 --> G4[Format Sources<br/>metadata + preview]
    G4 --> R1[FAQ Response<br/>with Sources]
    
    %% English Practice Mode Branch
    F --> F1[Process English Practice Query]
    F1 --> F2[Build Conversation Context<br/>System Prompt + History]
    F2 --> F3[LLM with Function Binding<br/>Available Tools]
    F3 --> F4[Generate Completion]
    F4 --> F5{Tool Calls<br/>Detected?}
    
    F5 -->|No| F6[Direct Response]
    F5 -->|Yes| F7[Handle Function Calls]
    
    F7 --> F71[Parse Tool Call<br/>OpenAI/LangChain Format]
    F71 --> F72[Execute Function<br/>get_pronunciation_help, etc.]
    F72 --> F73[Create Follow-up Messages<br/>Assistant + Tool Results]
    F73 --> F74[Final LLM Call<br/>Incorporate Results]
    F74 --> F75[Add Function Info<br/>to Sources]
    F75 --> F8[Function Response]
    
    F6 --> R2[Practice Response<br/>Direct Answer]
    F8 --> R2
    
    %% Response Assembly
    R1 --> Z[Standardized Response]
    R2 --> Z
    Z --> Z1{Response Format}
    Z1 --> Z2[success: true<br/>response: text<br/>mode: FAQ/Practice<br/>sources: array<br/>timestamp: ISO]
    Z2 --> END[Return to Client]
    
    %% Error Handling
    B -->|Error| ERR[Error Response]
    C -->|Error| ERR
    G2 -->|Error| ERR
    F4 -->|Error| ERR
    ERR --> ERR1[success: false<br/>error: message<br/>mode: Error<br/>sources: empty]
    ERR1 --> END
    
    %% Knowledge Base Sources
    KB[(Knowledge Base<br/>JSON File)] --> C1
    KB --> KB1[subscription_plans<br/>learning_roadmap<br/>troubleshooting<br/>contact_support]
    
    %% External Services
    OPENAI[OpenAI API] --> C3
    OPENAI --> G24
    OPENAI --> F4
    OPENAI --> F74
    
    FUNC[Functions Module<br/>utils/functions.js] --> F72
    
    %% Styling
    classDef startEnd fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef process fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef data fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef service fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef error fill:#ffebee,stroke:#d32f2f,stroke-width:2px
    
    class A,END startEnd
    class C,C1,C2,C3,C4,C5,C6,G1,G2,G21,G22,G23,G24,G25,G3,G4,F1,F2,F3,F4,F7,F71,F72,F73,F74,F75,Z,Z2 process
    class B,D,E,H,F5,Z1 decision
    class KB,KB1,FUNC data
    class OPENAI service
    class ERR,ERR1 error
