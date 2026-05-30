import React, { useState, useRef } from 'react';
import { 
  Topic, Question, InterviewIntelligenceQuestion, Mistake, 
  ActivityPlan, Roadmap, Journal, Interview, TopicStatus, ActivityCategory, JournalType 
} from '../types';
import { 
  FileJson, FileSpreadsheet, Copy, Check, Trash2, HelpCircle, 
  Upload, Download, AlertTriangle, CheckCircle, Info, Clipboard, ChevronRight, Play
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface BulkImportExportCenterProps {
  topics: Topic[];
  questions: Question[];
  intelliQuestions: InterviewIntelligenceQuestion[];
  mistakes: Mistake[];
  plans: ActivityPlan[];
  roadmaps: Roadmap[];
  journals: Journal[];
  interviews: Interview[];
  onBulkImport: (dataType: string, records: any[], duplicatePolicy: 'skip' | 'replace' | 'keep') => Promise<{ imported: number; updated: number; skipped: number }>;
}

const TEMPLATES = {
  Topics: {
    format: 'JSON / CSV / Excel',
    requiredFields: ['name', 'category'],
    optionalFields: ['description', 'status', 'confidenceScore', 'recallScore', 'notes'],
    example: [
      {
        name: "Spring Boot Microservices",
        category: "Backend Development",
        description: "Focus on cloud-native configurations, Eureka server registry, gateways, and load balancing mechanics.",
        status: "Learning",
        confidenceScore: 55,
        recallScore: 40,
        notes: "Key review area: circuit breakers and resilience4j fallbacks."
      },
      {
        name: "Java Advanced Concurrency",
        category: "Core Java",
        description: "Deep dive into virtual threads (Java 21), CompletableFuture pipelines, and ForkJoinPool architectures.",
        status: "Practicing",
        confidenceScore: 70,
        recallScore: 65,
        notes: "Study synchronized blocks vs. ReentrantLock performance characteristics."
      }
    ],
    prompt: `Generate 15 high-frequency enterprise Java Backend topics using this exact JSON structure:
[
  {
    "name": "Topic Name",
    "category": "Topic Category (e.g. Core Java, System Design, DSA)",
    "description": "Short explanatory brief",
    "status": "Not Started | Learning | Practicing | Revising | Interview Ready | Mastered",
    "confidenceScore": 50,
    "recallScore": 30,
    "notes": "Study reminders or deep architectural takeaways"
  }
]`
  },
  Questions: {
    format: 'JSON / CSV / Excel',
    requiredFields: ['question', 'answer'],
    optionalFields: ['difficulty', 'tags', 'source', 'topicName'],
    example: [
      {
        question: "How does Garbage Collection handle memory recovery in G1 GC?",
        answer: "G1 GC divides the heap into equal-sized regions. It targets regions with the most garbage first ('Garbage-First') using parallel threads to compact memory and meet latency-bound targets.",
        difficulty: "Hard",
        tags: "java,garbage-collection,jvm",
        source: "Interview",
        topicName: "Java Memory Model"
      },
      {
        question: "Explain the difference between optimistic and pessimistic locking.",
        answer: "Optimistic locking assumes conflicts are rare and uses version numbers (CAS) upon commit. Pessimistic locking locks the database rows immediately via 'SELECT FOR UPDATE' to block other writers.",
        difficulty: "Medium",
        tags: "databases,locking,concurrency",
        source: "Personal Notes",
        topicName: "Advanced Concurrency"
      }
    ],
    prompt: `Act as a principal software engineer. Generate 20 system design and concurrency questions with complete high-quality answers using this JSON structure:
[
  {
    "question": "Clear and detailed technical question text",
    "answer": "Thorough, professional, correct answer explanation",
    "difficulty": "Easy | Medium | Hard",
    "tags": "comma-separated-tags",
    "source": "Interview | Course | Book | Internet | Personal Notes",
    "topicName": "Name of an associated main study topic (e.g. Concurrency)"
  }
]`
  },
  'Interview Questions': {
    format: 'JSON / CSV / Excel',
    requiredFields: ['company', 'question', 'answer'],
    optionalFields: ['difficulty', 'topic', 'result', 'dateAsked'],
    example: [
      {
        company: "Google",
        question: "Design a distributed metrics aggregator that can ingest 10M events per second with high availability.",
        answer: "Use an ingest fleet backed by Apache Kafka for buffer zoning, processed by Apache Flink streaming clusters, aggregated in sliding time windows, and recorded in a columnar time-series database like ClickHouse.",
        difficulty: "Hard",
        topic: "System Design",
        result: "Struggled",
        dateAsked: "2026-05-15"
      },
      {
        company: "Amazon",
        question: "Determine the optimum data structure to perform live IP lookup prefixes in O(1) time.",
        answer: "IP lookup prefixes are optimally solved using a specialized Radix Tree or Trie structures containing subnet transitions with dynamic bit masking.",
        difficulty: "Hard",
        topic: "Data Structures",
        result: "Answered Correctly",
        dateAsked: "2026-05-20"
      }
    ],
    prompt: `Generate 15 interview intelligence questions asked by major tech firms like Google, Amazon, or Meta using this JSON template:
[
  {
    "company": "Company Name",
    "question": "Specific question asked during active rounds",
    "answer": "Pristine technical explanation resolving the prompt",
    "difficulty": "Easy | Medium | Hard",
    "topic": "Related high-level domain (e.g. Databases, System Design)",
    "result": "Answered Correctly | Struggled | Failed",
    "dateAsked": "YYYY-MM-DD"
  }
]`
  },
  'Mistake Journals': {
    format: 'JSON / CSV / Excel',
    requiredFields: ['companyName', 'reason'],
    optionalFields: ['missedQuestions', 'date'],
    example: [
      {
        companyName: "Netflix",
        reason: "Failed to properly scale the Kafka partition indexer in system modeling block. Did not account for partition rebalancing latency overheads.",
        missedQuestions: "How do you avoid rebalancing freezes in large consumer group topologies?,Explain partition offset committing strategies.",
        date: "2026-05-12"
      }
    ],
    prompt: `Generate a detailed set of candidate mistake templates documenting technical and conceptual gaps using this JSON outline:
[
  {
    "companyName": "Company Name",
    "reason": "Clear narrative post-mortem explaining what concept was missed and why details were skipped",
    "missedQuestions": "Question One Missed,Question Two Missed (comma separated list)",
    "date": "YYYY-MM-DD"
  }
]`
  },
  'Activity Plans': {
    format: 'JSON / CSV / Excel',
    requiredFields: ['title', 'targetHours', 'category'],
    optionalFields: ['startDate', 'endDate', 'repeatType'],
    example: [
      {
        title: "LeetCode Daily Medium Grind",
        targetHours: 1.5,
        category: "DSA",
        startDate: "2026-06-01",
        endDate: "2026-06-30",
        repeatType: "Daily"
      },
      {
        title: "Architectural Video Series Analysis",
        targetHours: 3.0,
        category: "Technical",
        startDate: "2026-06-05",
        endDate: "2526-07-05",
        repeatType: "Weekly"
      }
    ],
    prompt: `Generate 5 structured activity study schedules matching this structural schema:
[
  {
    "title": "Title of the habit or plan",
    "targetHours": 2.5,
    "category": "Technical | Communication | Interview Preparation | DSA | Reading | Writing | Speaking | Listening | Custom",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "repeatType": "Daily | Weekly | Custom"
  }
]`
  },
  'Roadmaps': {
    format: 'JSON ONLY',
    requiredFields: ['title', 'topics'],
    optionalFields: ['description'],
    example: [
      {
        title: "Kubernetes Cloud Masterclass",
        description: "From containers fundamentals up to multi-cluster service fabrics and canary operators deployment patterns.",
        topics: [
          { name: "Container Runtimes & Docker namespaces", completed: true, dependencies: [] },
          { name: "Pods lifecycle, Replicasets & standard Deployments", completed: false, dependencies: ["Container Runtimes & Docker namespaces"] },
          { name: "Service mesh routing protocols & Istio Gateways", completed: false, dependencies: ["Pods lifecycle, Replicasets & standard Deployments"] }
        ]
      }
    ],
    prompt: `Generate a hierarchical roadmap with logical dependency chains using this nested JSON schema:
[
  {
    "title": "Roadmap Track Title",
    "description": "General description outline",
    "topics": [
      { "name": "Topic Name A", "completed": false, "dependencies": [] },
      { "name": "Topic Name B", "completed": false, "dependencies": ["Topic Name A"] }
    ]
  }
]`
  },
  'Journal Entries': {
    format: 'JSON / CSV / Excel',
    requiredFields: ['title', 'content'],
    optionalFields: ['type', 'tags', 'createdAt'],
    example: [
      {
        title: "Active Spacing Recovery Reflection",
        content: "Studied System Design patterns. Felt strong with load balancers, but need to re-read persistent hashing algorithms. Understood consistent ring layouts much better today.",
        type: "Learning Journal",
        tags: "retention,system-design",
        createdAt: "2026-05-29T10:15:00Z"
      }
    ],
    prompt: `Generate reflective coding journal entries reflecting technical progress during studies in this exact format:
[
  {
    "title": "Topic Reflection Title",
    "content": "Deep personal description detailing exactly what you understood and where gaps remain.",
    "type": "Daily Reflection | Interview Reflection | Learning Journal | Weekly Review Journal",
    "tags": "tags-delimited-with-commas",
    "createdAt": "ISO-string-timestamp"
  }
]`
  }
};

export default function BulkImportExportCenter({
  topics,
  questions,
  intelliQuestions,
  mistakes,
  plans,
  roadmaps,
  journals,
  interviews,
  onBulkImport
}: BulkImportExportCenterProps) {
  // Navigation inside Center
  const [activeSubTab, setActiveSubTab] = useState<'import' | 'templates' | 'export'>('import');

  // Import State
  const [targetType, setTargetType] = useState<keyof typeof TEMPLATES>('Topics');
  const [rawText, setRawText] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [duplicatePolicy, setDuplicatePolicy] = useState<'skip' | 'replace' | 'keep'>('skip');

  // Parser Result state
  const [parseStatus, setParseStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [parsedRecords, setParsedRecords] = useState<any[]>([]);
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);
  const [errorLogs, setErrorLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Copy Template handler state
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate properties for selected type
  const validateRecordField = (type: string, record: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const templateDef = TEMPLATES[type as keyof typeof TEMPLATES];
    if (!templateDef) {
      return { isValid: false, errors: ['Unknown template format'] };
    }

    templateDef.requiredFields.forEach(field => {
      if (record[field] === undefined || record[field] === null || String(record[field]).trim() === '') {
        errors.push(`Missing required field: "${field}"`);
      }
    });

    // Special verification rules
    if (type === 'Roadmaps' && record.topics) {
      if (!Array.isArray(record.topics)) {
        errors.push('"topics" must be a JSON array of structures');
      } else {
        record.topics.forEach((t: any, idx: number) => {
          if (!t.name) {
            errors.push(`Topic at index ${idx} in Roadmap is missing 'name'`);
          }
        });
      }
    }

    return { isValid: errors.length === 0, errors };
  };

  // Run validation on raw pasted text or file parsed output
  const handleParseData = (inputArray: any[]) => {
    try {
      if (!Array.isArray(inputArray)) {
        throw new Error('Parsed outcome is not a valid list array');
      }

      const validated: any[] = [];
      let valid = 0;
      let invalid = 0;
      const logs: string[] = [];

      inputArray.forEach((item, idx) => {
        const { isValid, errors } = validateRecordField(targetType, item);
        if (isValid) {
          valid++;
          validated.push({ ...item, __validated: true });
        } else {
          invalid++;
          logs.push(`Record #${idx + 1}: ${errors.join(', ')}`);
          validated.push({ ...item, __validated: false, __errors: errors });
        }
      });

      setParsedRecords(validated);
      setValidCount(valid);
      setInvalidCount(invalid);
      setErrorLogs(logs);
      setParseStatus('success');
    } catch (e: any) {
      setParseStatus('error');
      setErrorLogs([`Invalid payload logic structure: ${e.message}`]);
      setParsedRecords([]);
      setValidCount(0);
      setInvalidCount(0);
    }
  };

  // Handle JSON Text Paste Parsing
  const handlePasteParse = () => {
    if (!rawText.trim()) {
      alert('Please paste some valid JSON or CSV data in the box first.');
      return;
    }
    setErrorLogs([]);
    setParseStatus('idle');

    // Attempt direct JSON payload parsing
    if (rawText.trim().startsWith('[') || rawText.trim().startsWith('{')) {
      try {
        let parsed = JSON.parse(rawText);
        if (!Array.isArray(parsed)) {
          parsed = [parsed];
        }
        handleParseData(parsed);
      } catch (err: any) {
        setParseStatus('error');
        setErrorLogs([`JSON Syntax Parsing Error: ${err.message}`]);
      }
    } else {
      // Fallback: Custom lightweight CSV parser
      try {
        const parsed = parseCsvString(rawText);
        handleParseData(parsed);
      } catch (err: any) {
        setParseStatus('error');
        setErrorLogs([`Custom CSV Parsing error: ${err.message}`]);
      }
    }
  };

  // Native lightweight CSV parser
  const parseCsvString = (text: string): any[] => {
    const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length < 2) {
      throw new Error('CSV must contain a header row and at least 1 record row.');
    }

    // Split headers cleanly handling quotes safely
    const parseCSVRow = (row: string) => {
      const result: string[] = [];
      let currentCol = '';
      let insideQuotes = false;
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
          result.push(currentCol.trim());
          currentCol = '';
        } else {
          currentCol += char;
        }
      }
      result.push(currentCol.trim());
      return result;
    };

    const headers = parseCSVRow(lines[0]);
    const list: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVRow(lines[i]);
      const obj: any = {};
      headers.forEach((h, idx) => {
        let val: any = cols[idx] !== undefined ? cols[idx] : '';
        // Unquote wrappers
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        }
        // Try convert numbers
        if (val !== '' && !isNaN(val)) {
          obj[h] = Number(val);
        } else if (val === 'true') {
          obj[h] = true;
        } else if (val === 'false') {
          obj[h] = false;
        } else {
          obj[h] = val;
        }
      });
      list.push(obj);
    }
    return list;
  };

  // Handle Binary Excel File Selection File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setImportFile(file);
    setErrorLogs([]);
    setParseStatus('idle');

    const reader = new FileReader();
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'json') {
      reader.onload = (evt) => {
        try {
          const parsed = JSON.parse(evt.target?.result as string);
          handleParseData(Array.isArray(parsed) ? parsed : [parsed]);
        } catch (err: any) {
          setParseStatus('error');
          setErrorLogs([`JSON File parser error: ${err.message}`]);
        }
      };
      reader.readAsText(file);
    } else if (extension === 'csv') {
      reader.onload = (evt) => {
        try {
          const parsed = parseCsvString(evt.target?.result as string);
          handleParseData(parsed);
        } catch (err: any) {
          setParseStatus('error');
          setErrorLogs([`CSV File parser error: ${err.message}`]);
        }
      };
      reader.readAsText(file);
    } else if (extension === 'xlsx' || extension === 'xls') {
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const results = XLSX.utils.sheet_to_json(worksheet);
          handleParseData(results);
        } catch (err: any) {
          setParseStatus('error');
          setErrorLogs([`Excel File binary parse error: ${err.message}`]);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setParseStatus('error');
      setErrorLogs([`Unsupported file format: .${extension}. Only .json, .csv, and .xlsx supported.`]);
    }
  };

  // Reset import workspace
  const handleResetWorkspace = () => {
    setRawText('');
    setImportFile(null);
    setParsedRecords([]);
    setParseStatus('idle');
    setErrorLogs([]);
    setValidCount(0);
    setInvalidCount(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Copy AI Prompt template handler
  const handleCopyPrompt = (type: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  // Confirm Import Action and write to parent Firebase modifier
  const triggerImportAction = async () => {
    const validOnly = parsedRecords.filter(r => r.__validated);
    if (validOnly.length === 0) {
      alert('No valid records found to import. Fix formatting issues and try again.');
      return;
    }

    setIsProcessing(true);
    try {
      // Clean temporary validation keys before saving
      const cleaned = validOnly.map(r => {
        const copy = { ...r };
        delete copy.__validated;
        delete copy.__errors;
        return copy;
      });

      const outcome = await onBulkImport(targetType, cleaned, duplicatePolicy);
      alert(`Import completed successfully under policy: "${duplicatePolicy}"\n\n- Saved: ${outcome.imported} items\n- Updated: ${outcome.updated} items\n- Skipped: ${outcome.skipped} items`);
      handleResetWorkspace();
    } catch (e: any) {
      alert(`Firestore bulk write insertion failed: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // EXPORT ENGINE IMPLEMENTATION
  const triggerDataExport = (type: string, format: 'json' | 'csv' | 'xlsx') => {
    let sourceData: any[] = [];
    switch (type) {
      case 'Topics': sourceData = topics; break;
      case 'Questions': sourceData = questions; break;
      case 'Interviews': sourceData = interviews; break;
      case 'Mistakes': sourceData = mistakes; break;
      case 'Activities': sourceData = plans; break;
      case 'Journals': sourceData = journals; break;
      case 'Roadmaps': sourceData = roadmaps; break;
      default: return;
    }

    if (sourceData.length === 0) {
      alert(`No records in workspace cache for ${type}. Seed data or add items to allow downloads.`);
      return;
    }

    // Clean sensitive database fields from download exports for cleaner transfer
    const exportCleanObj = (item: any) => {
      const copy = { ...item };
      delete copy.userId;
      return copy;
    };

    const cleanedData = sourceData.map(exportCleanObj);

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(cleanedData, null, 2)], { type: 'application/json' });
      downloadBlob(blob, `PrepMaster_${type}_Export.json`);
    } else if (format === 'csv') {
      const headers = Object.keys(cleanedData[0] || {}).filter(k => k !== 'topics' && typeof cleanedData[0][k] !== 'object');
      const csvContent = [
        headers.join(','),
        ...cleanedData.map(row => 
          headers.map(field => `"${String(row[field] ?? '').replace(/"/g, '""')}"`).join(',')
        )
      ].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      downloadBlob(blob, `PrepMaster_${type}_Export.csv`);
    } else if (format === 'xlsx') {
      // Handle Nested Roadmaps parsing beautifully for spreadsheets
      let xlsxData = cleanedData;
      if (type === 'Roadmaps') {
        xlsxData = cleanedData.map(r => ({
          id: r.id,
          title: r.title,
          description: r.description,
          total_topics: r.topics?.length || 0,
          topics_summary: r.topics?.map((t: any) => `${t.name} (${t.completed ? 'Comp' : 'Pending'})`).join(' -> ') || '',
          isActive: r.isActive,
          createdAt: r.createdAt
        }));
      }

      const worksheet = XLSX.utils.json_to_sheet(xlsxData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `${type} Backup`);
      XLSX.writeFile(workbook, `PrepMaster_${type}_Export.xlsx`);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION AND CHIPS TITLE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
            <span>Smart Bulk Import & Export Center</span>
          </h2>
          <p className="text-xs text-slate-400">
            Pristinely seed, transfer, and synchronize high-volume preparation parameters using external AI platforms.
          </p>
        </div>

        {/* Dynamic sub navigation tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5 font-sans self-start md:self-auto">
          <button
            onClick={() => setActiveSubTab('import')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeSubTab === 'import' ? 'bg-indigo-650 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Import Data
          </button>
          <button
            onClick={() => setActiveSubTab('templates')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeSubTab === 'templates' ? 'bg-indigo-650 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            AI Prompt Templates
          </button>
          <button
            onClick={() => setActiveSubTab('export')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeSubTab === 'export' ? 'bg-indigo-650 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Export Backup
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE CENTER MODULE */}
      {activeSubTab === 'import' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* CONFIGURATION & INPUT PANEL (Span 2) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-bold text-white text-sm border-b border-white/5 pb-2 uppercase tracking-wide">
                Configure Bulk Upload Stream
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                {/* Step 1 Select Datatype */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold block">Step 1: Select Target Entity</label>
                  <p className="text-[10px] text-slate-450 leading-none">Choose what catalog to append your batch to.</p>
                  <select
                    value={targetType}
                    onChange={(e) => {
                      setTargetType(e.target.value as any);
                      handleResetWorkspace();
                    }}
                    className="w-full px-3 py-2 border rounded-xl glass-input text-slate-200 cursor-pointer"
                  >
                    {Object.keys(TEMPLATES).map(opt => (
                      <option key={opt} value={opt} className="bg-[#111827] text-white">
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Step 2 Selection Duplicate Handling Policy */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold block">Step 2: Duplicate Resolution</label>
                  <p className="text-[10px] text-slate-450 leading-none">Determine actions if keys already exist.</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { key: 'skip', label: 'Skip' },
                      { key: 'replace', label: 'Replace' },
                      { key: 'keep', label: 'Keep Both' }
                    ].map(pol => (
                      <button
                        key={pol.key}
                        onClick={() => setDuplicatePolicy(pol.key as any)}
                        className={`py-2 px-1.5 border rounded-lg text-center transition font-semibold text-[10px] ${
                          duplicatePolicy === pol.key
                            ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
                            : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        {pol.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Input section splits into paste area or file drag uploads */}
              <div className="space-y-3">
                <span className="text-slate-300 text-xs font-semibold block">Step 3: Paste JSON / CSV Payload or drag file below</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Paste JSON raw text container */}
                  <div className="space-y-2">
                    <textarea
                      rows={6}
                      value={rawText}
                      onChange={(e) => {
                        setRawText(e.target.value);
                        setImportFile(null);
                        setParseStatus('idle');
                      }}
                      placeholder={`Paste structural JSON list format or raw CSV entries here...`}
                      className="w-full p-3 font-mono text-[10px] bg-[#111827]/40 text-slate-300 rounded-xl border border-white/5 focus:ring-1 focus:ring-indigo-500 resize-none h-44"
                    />
                    <button
                      onClick={handlePasteParse}
                      disabled={!rawText.trim()}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-550 disabled:opacity-50 text-white rounded-xl text-xs font-bold font-sans tracking-wide transition flex items-center justify-center gap-1.5 cursor-pointer shadow"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Parse & Validate Pasted Block</span>
                    </button>
                  </div>

                  {/* Drag-drop attachment loader wrapper */}
                  <div className="border border-dashed border-white/10 hover:border-indigo-500/30 transition rounded-xl bg-white/5 p-5 flex flex-col items-center justify-center text-center space-y-2 h-44 cursor-pointer relative overflow-hidden group">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".json,.csv,.xlsx,.xls"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="w-8 h-8 text-indigo-400 group-hover:scale-110 transition" />
                    <span className="text-xs font-bold text-white">Upload File Template</span>
                    <span className="text-[10px] text-slate-400 block max-w-xs">Supports Excel (.xlsx), comma delimited CSV, or formatted JSON databases.</span>
                    {importFile && (
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25 mt-1 block">
                        Selected: {importFile.name}
                      </span>
                    )}
                  </div>

                </div>
              </div>

              {/* Display dynamic preview and validations status counters if parsed */}
              {parseStatus === 'success' && (
                <div className="border-t border-white/10 pt-4 mt-2 space-y-4 font-sans animate-fade-in text-left">
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-white/5 border border-white/5 p-4 rounded-2xl">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-mono font-bold text-indigo-400 block leading-none">Workspace Validation Status</span>
                      <h4 className="font-extrabold text-white text-base leading-none">Data Verification Compiles Complete</h4>
                    </div>

                    <div className="grid grid-cols-3 gap-6 text-center">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-mono text-slate-405 uppercase tracking-widest block">Total Found</span>
                        <span className="text-sm font-extrabold text-white font-mono">{parsedRecords.length}</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-mono text-emerald-405 uppercase tracking-widest block">Valid</span>
                        <span className="text-sm font-extrabold text-emerald-400 font-mono">{validCount}</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-mono text-rose-405 uppercase tracking-widest block">Invalid</span>
                        <span className="text-sm font-extrabold text-rose-450 font-mono">{invalidCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Errors / Warnings log center */}
                  {errorLogs.length > 0 && (
                    <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-xs space-y-1.5">
                      <span className="font-bold text-rose-300 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                        <span>Discovered Gaps ({errorLogs.length})</span>
                      </span>
                      <div className="max-h-24 overflow-y-auto custom-scrollbar font-mono text-[10px] text-rose-350 space-y-1 divide-y divide-white/5">
                        {errorLogs.map((log, idx) => (
                          <div key={idx} className="pt-1">{log}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* PREVIEW RECORDS SECTION */}
                  <div className="space-y-2">
                    <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider font-extrabold">Batch Preview Records List</span>
                    <div className="max-h-60 overflow-y-auto border border-white/5 bg-[#111827]/40 rounded-xl divide-y divide-white/5 text-xs custom-scrollbar">
                      {parsedRecords.map((rec, idx) => (
                        <div key={idx} className="p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-slate-350">
                          <div className="space-y-1 flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-mono font-bold bg-[#111827] border border-white/5 text-slate-400 px-1.5 rounded-md leading-none h-5 flex items-center">#{idx + 1}</span>
                              <span className="font-extrabold text-white text-xs truncate max-w-xs">{rec.name || rec.question || rec.title || rec.companyName || rec.company || 'Record Name'}</span>
                              <span className="text-[9px] text-slate-500 font-semibold">{rec.category || rec.difficulty || rec.roundType}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 line-clamp-1 italic">"{rec.description || rec.answer || rec.content || rec.reason || 'No summary content data.'}"</p>
                          </div>

                          <div className="flex items-center gap-3 self-end md:self-auto shrink-0 font-mono">
                            {rec.__validated ? (
                              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-md font-bold uppercase">Pass</span>
                            ) : (
                              <span className="text-[9px] bg-red-500/10 text-rose-400 border border-red-500/25 px-2 py-0.5 rounded-md font-bold uppercase">Corrupt</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom trigger action button */}
                  <div className="flex items-center gap-3 pt-3 border-t border-white/5 mt-4">
                    <button
                      onClick={triggerImportAction}
                      disabled={isProcessing || validCount === 0}
                      className="flex-1 py-3 bg-indigo-650 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold font-sans tracking-wide transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>{isProcessing ? 'Writing batch records inside Space...' : `Confirm Import Valid ${validCount} Records`}</span>
                    </button>
                    <button
                      onClick={handleResetWorkspace}
                      className="px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 rounded-xl text-xs font-bold font-sans cursor-pointer text-center"
                    >
                      Reset Workspace
                    </button>
                  </div>
                </div>
              )}

              {parseStatus === 'error' && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-xs space-y-1.5 font-sans animate-fade-in text-left">
                  <span className="font-bold text-rose-300 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>Critical Parser Interruption Encountered</span>
                  </span>
                  <p className="font-mono text-[10px] text-rose-350 leading-relaxed">
                    {errorLogs[0]}
                  </p>
                  <button
                    onClick={handleResetWorkspace}
                    className="mt-2 py-1.5 px-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-md text-[10px] text-slate-300 font-mono block cursor-pointer"
                  >
                    Clear Workspace & Retry
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* SIDEBAR TIPS & DOCUMENTATION */}
          <div className="space-y-6">
            <div className="glass-card p-5 space-y-4">
              <h3 className="font-bold text-white text-sm border-b border-white/5 pb-2 uppercase tracking-wide">
                Schema Integration Tips
              </h3>

              <div className="space-y-3.5 text-xs leading-relaxed font-sans text-slate-400">
                <div className="bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/10 space-y-1">
                  <span className="font-bold text-white block">Excel (.xlsx) Guidelines</span>
                  <p className="text-[10px] text-slate-400">
                    The header row must EXACTLY match the required schema fields. Ensure sheet variables names have no spaces or special symbols.
                  </p>
                </div>

                <div className="bg-[#111827]/40 p-3 rounded-xl border border-white/5 space-y-1">
                  <span className="font-bold text-white block">Spaced Repetition Auto-Seeding</span>
                  <p className="text-[10px] text-slate-400">
                    Imported topics with unspecified "confidence" default to 0%. Spaced repetition clocks kick off immediately.
                  </p>
                </div>

                <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 space-y-1 text-slate-300">
                  <span className="font-bold text-amber-300 block">🤖 Prompt Engineering Secret</span>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Navigate to the **AI Prompt Templates** tab at the top. Choose an entity, copy our structurally locked JSON structure, and feed it directly into any LLM chatbot to generate vast study datasets instantly.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {activeSubTab === 'templates' && (
        <div className="space-y-6">
          <div className="bg-indigo-600/15 border border-indigo-500/20 p-4 rounded-xl text-xs space-y-1 leading-normal font-sans text-left">
            <span className="font-bold text-indigo-300 flex items-center gap-1">
              <Info className="w-4 h-4 text-indigo-400" />
              <span>How to utilize AI Mock Generators</span>
            </span>
            <p className="text-slate-300">
              PrepMaster isolates code execution boundaries from raw LLM responses. Run complex topics expansions outside our application by copy-pasting standard formats into your AI of choice, then save files or copy JSON blocks to drag-insert in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {Object.entries(TEMPLATES).map(([key, def]) => (
              <div key={key} className="glass-card p-5 space-y-4 border border-white/5 flex flex-col justify-between">
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                    <div>
                      <h4 className="font-extrabold text-white text-sm">{key} Template</h4>
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-black">Format: {def.format}</span>
                    </div>

                    <button
                      onClick={() => handleCopyPrompt(key, JSON.stringify(def.example, null, 2))}
                      className="px-2.5 py-1.5 rounded-lg border border-white/5 bg-white/5 text-[10px] font-semibold text-slate-300 hover:text-white transition flex items-center gap-1 cursor-pointer select-none"
                    >
                      {copiedType === key ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Clipboard className="w-3.5 h-3.5" />}
                      <span>{copiedType === key ? 'Copied' : 'Copy JSON'}</span>
                    </button>
                  </div>

                  {/* Schema fields tags */}
                  <div className="space-y-1 text-xs">
                    <span className="text-slate-400 font-semibold block">Schema Attributes Checklist:</span>
                    <div className="flex flex-wrap gap-1">
                      {def.requiredFields.map(f => (
                        <span key={f} className="text-[9px] font-mono bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded-md font-bold uppercase">
                          {f} (req)
                        </span>
                      ))}
                      {def.optionalFields.map(f => (
                        <span key={f} className="text-[9px] font-mono bg-white/5 border border-white/5 text-slate-405 px-1.5 py-0.5 rounded-md font-bold uppercase">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Interactive editable example code preview box */}
                  <div className="space-y-1 font-sans">
                    <span className="text-slate-400 font-semibold block text-xs">Structural Model Preview:</span>
                    <pre className="p-3 bg-black/45 rounded-xl border border-white/5 text-[9px] font-mono text-slate-350 max-h-36 overflow-y-auto custom-scrollbar leading-relaxed">
                      {JSON.stringify(def.example, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* AI Prompts block generator */}
                <div className="border-t border-white/10 pt-3 mt-1 space-y-2">
                  <span className="text-slate-400 font-semibold text-xs block">Optimal AI Prompts:</span>
                  <div className="bg-[#111827]/40 p-2.5 rounded-lg border border-white/5 text-[11px] leading-relaxed text-slate-400 italic font-sans flex items-start gap-1 justify-between">
                    <span className="line-clamp-2">"{def.prompt}"</span>
                    <button
                      onClick={() => handleCopyPrompt(key + '-prompt', def.prompt)}
                      className="text-indigo-400 hover:text-indigo-300 text-[10px] font-bold font-mono uppercase tracking-wider shrink-0 cursor-pointer ml-2 select-none"
                    >
                      {copiedType === key + '-prompt' ? 'Copied!' : 'Copy Prompt'}
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'export' && (
        <div className="glass-card p-6 space-y-6 text-left">
          
          <div className="space-y-2">
            <h3 className="font-bold text-white text-sm border-b border-white/5 pb-2 uppercase tracking-wide">
              Export Database Hub
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Export your structured PrepMaster preparation tracking history anytime. Downloads include all active elements, revision progress, custom journal observations, and tracking metrics in three dynamic layouts.
            </p>
          </div>

          {/* Export cards grid layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { type: 'Topics', count: topics.length, desc: 'All spacing repetition domains with metrics' },
              { type: 'Questions', count: questions.length, desc: 'All flashcards, difficulties & tags lists' },
              { type: 'Interviews', count: interviews.length, desc: 'Interview histories, feedback & status indicators' },
              { type: 'Mistakes', count: mistakes.length, desc: 'Post-mortem tracking and failure diagnostics' },
              { type: 'Activities', count: plans.length, desc: 'Strategic weekly tracking targets and durations' },
              { type: 'Journals', count: journals.length, desc: 'Your collection of reflective learning summaries' },
              { type: 'Roadmaps', count: roadmaps.length, desc: 'Hierarchical learning tracks and depend links' }
            ].map(item => (
              <div key={item.type} className="p-4 bg-[#111827]/40 rounded-2xl border border-white/5 hover:border-white/10 transition flex flex-col justify-between space-y-4">
                
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-white text-sm block">{item.type} backup</span>
                    <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-lg border border-indigo-500/20 font-black">
                      {item.count} items
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {item.desc}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px] pt-2 border-t border-white/5">
                  <button
                    onClick={() => triggerDataExport(item.type, 'json')}
                    disabled={item.count === 0}
                    className="py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-40 text-slate-300 rounded-lg text-center transition cursor-pointer font-bold border border-white/5"
                  >
                    JSON
                  </button>
                  <button
                    onClick={() => triggerDataExport(item.type, 'csv')}
                    disabled={item.count === 0}
                    className="py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-40 text-slate-300 rounded-lg text-center transition cursor-pointer font-bold border border-white/5"
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => triggerDataExport(item.type, 'xlsx')}
                    disabled={item.count === 0}
                    className="py-1.5 bg-indigo-650/15 hover:bg-indigo-650/30 disabled:opacity-40 text-indigo-300 border border-indigo-500/10 rounded-lg text-center transition cursor-pointer font-extrabold"
                  >
                    Excel (.xlsx)
                  </button>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
}
