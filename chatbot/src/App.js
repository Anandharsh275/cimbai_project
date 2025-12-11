import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Upload, FileText, Send, Bot, User, Trash2, Plus, X, Search, BookOpen, HelpCircle } from 'lucide-react';

const AISupportChatbot = () => {
  const [screen, setScreen] = useState('chat');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [faqs, setFaqs] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [showFaqForm, setShowFaqForm] = useState(false);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const storedFaqs = localStorage.getItem('companyFaqs');
    const storedDocs = localStorage.getItem('companyDocuments');
    const storedMessages = localStorage.getItem('chatMessages');
    
    if (storedFaqs) setFaqs(JSON.parse(storedFaqs));
    if (storedDocs) setDocuments(JSON.parse(storedDocs));
    if (storedMessages) setMessages(JSON.parse(storedMessages));
    
    // Add welcome message if no messages exist
    if (!storedMessages) {
      setMessages([{
        role: 'assistant',
        content: 'Hello! I\'m your AI support assistant. I can help answer questions about our company, products, and services based on our knowledge base. How can I help you today?',
        timestamp: new Date().toISOString()
      }]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('companyFaqs', JSON.stringify(faqs));
  }, [faqs]);

  useEffect(() => {
    localStorage.setItem('companyDocuments', JSON.stringify(documents));
  }, [documents]);

  const buildKnowledgeBase = () => {
    let kb = 'COMPANY KNOWLEDGE BASE:\n\n';
    
    if (faqs.length > 0) {
      kb += '=== FREQUENTLY ASKED QUESTIONS ===\n\n';
      faqs.forEach((faq, idx) => {
        kb += `Q${idx + 1}: ${faq.question}\nA${idx + 1}: ${faq.answer}\n\n`;
      });
    }
    
    if (documents.length > 0) {
      kb += '\n=== COMPANY DOCUMENTS ===\n\n';
      documents.forEach((doc, idx) => {
        kb += `Document ${idx + 1}: ${doc.name}\nContent: ${doc.content}\n\n`;
      });
    }
    
    if (faqs.length === 0 && documents.length === 0) {
      kb += 'No FAQs or documents have been added yet.\n';
    }
    
    return kb;
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const knowledgeBase = buildKnowledgeBase();
      const conversationHistory = messages.slice(-6).map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }));

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            ...conversationHistory,
            {
              role: "user",
              content: `${knowledgeBase}

INSTRUCTIONS:
You are a helpful customer support assistant. Answer the user's question based ONLY on the information provided in the knowledge base above. If the answer is not in the knowledge base, politely say you don't have that information and suggest they contact support for more details.

Be friendly, concise, and professional. If multiple FAQs or documents are relevant, reference them in your answer.

USER QUESTION: ${inputMessage}`
            }
          ]
        })
      });

      const data = await response.json();
      const assistantMessage = {
        role: 'assistant',
        content: data.content[0].text,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Error:', err);
      const errorMessage = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setLoading(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const newDoc = {
        id: Date.now(),
        name: file.name,
        content: text,
        uploadedAt: new Date().toISOString()
      };
      setDocuments(prev => [...prev, newDoc]);
    } catch (err) {
      console.error('Error reading file:', err);
      alert('Error reading file. Please try again.');
    }
  };

  const addFaq = () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) return;
    
    setFaqs(prev => [...prev, { ...newFaq, id: Date.now() }]);
    setNewFaq({ question: '', answer: '' });
    setShowFaqForm(false);
  };

  const deleteFaq = (id) => {
    setFaqs(prev => prev.filter(faq => faq.id !== id));
  };

  const deleteDocument = (id) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: 'Chat cleared. How can I help you today?',
      timestamp: new Date().toISOString()
    }]);
  };

  if (screen === 'knowledge') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setScreen('chat')}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-all"
            >
              <MessageSquare className="w-5 h-5" />
              Back to Chat
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Knowledge Base</h1>
            <div className="w-32"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* FAQs Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <HelpCircle className="w-6 h-6 text-indigo-500" />
                  FAQs ({faqs.length})
                </h2>
                <button
                  onClick={() => setShowFaqForm(!showFaqForm)}
                  className="flex items-center gap-2 px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add FAQ
                </button>
              </div>

              {showFaqForm && (
                <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
                  <input
                    type="text"
                    placeholder="Question"
                    value={newFaq.question}
                    onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <textarea
                    placeholder="Answer"
                    value={newFaq.answer}
                    onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 h-24 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={addFaq}
                      className="flex-1 bg-indigo-500 text-white py-2 rounded-lg hover:bg-indigo-600 transition-colors"
                    >
                      Save FAQ
                    </button>
                    <button
                      onClick={() => {
                        setShowFaqForm(false);
                        setNewFaq({ question: '', answer: '' });
                      }}
                      className="px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {faqs.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No FAQs added yet. Click "Add FAQ" to get started.</p>
                ) : (
                  faqs.map((faq) => (
                    <div key={faq.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-semibold text-gray-800 flex-1">{faq.question}</p>
                        <button
                          onClick={() => deleteFaq(faq.id)}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-gray-600 text-sm">{faq.answer}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Documents Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-purple-500" />
                  Documents ({documents.length})
                </h2>
                <label className="flex items-center gap-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Upload
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept=".txt,.md,.json,.csv"
                    className="hidden"
                  />
                </label>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {documents.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No documents uploaded yet. Upload .txt, .md, .json, or .csv files.</p>
                ) : (
                  documents.map((doc) => (
                    <div key={doc.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <FileText className="w-5 h-5 text-purple-500 mt-1" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 truncate">{doc.name}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600 mt-2 line-clamp-3">{doc.content}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteDocument(doc.id)}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto h-screen flex flex-col pb-4">
        {/* Header */}
        <div className="bg-white rounded-t-xl shadow-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">AI Support Assistant</h1>
              <p className="text-sm text-gray-500">
                {faqs.length} FAQs • {documents.length} Documents
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setScreen('knowledge')}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Manage KB
            </button>
            <button
              onClick={clearChat}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 bg-white shadow-lg overflow-y-auto p-6 space-y-4">
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'user' 
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-500' 
                  : 'bg-gradient-to-br from-indigo-500 to-purple-500'
              }`}>
                {message.role === 'user' ? (
                  <User className="w-5 h-5 text-white" />
                ) : (
                  <Bot className="w-5 h-5 text-white" />
                )}
              </div>
              <div
                className={`max-w-2xl px-4 py-3 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <p className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-gray-100 px-4 py-3 rounded-2xl">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white rounded-b-xl shadow-lg p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your question..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || loading}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISupportChatbot;