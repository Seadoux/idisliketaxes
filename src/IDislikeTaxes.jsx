import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Download, Mail, CheckCircle, HelpCircle, Play, Shield, Zap, X } from 'lucide-react';

const IDislikeTaxes = () => {
  const [step, setStep] = useState('upload');
  const [files, setFiles] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [clarifications, setClarifications] = useState([]);
  const [currentClarification, setCurrentClarification] = useState(0);
  const [classified, setClassified] = useState([]);
  const [unclassified, setUnclassified] = useState([]);
  const [email, setEmail] = useState('');
  const [emailCaptured, setEmailCaptured] = useState(false);
  const [showUnclassifiedReview, setShowUnclassifiedReview] = useState(false);
  const [userTier, setUserTier] = useState('free');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const savedTier = localStorage.getItem('tier') || 'free';
    const savedEmail = localStorage.getItem('userEmail');
    const expiryDate = localStorage.getItem('expiryDate');
    
    if (savedTier !== 'free') {
      setUserTier(savedTier);
      setEmailCaptured(true);
      if (savedEmail) setEmail(savedEmail);
      
      if (savedTier === 'basic' && expiryDate && new Date() > new Date(expiryDate)) {
        setUserTier('expired');
      }
    }
  }, []);

  const merchantDatabase = {
    editingSoftware: {
      category: 'Editing Software',
      emoji: '🎬',
      scheduleCLine: '27a',
      deductible: 100,
      merchants: ['adobe', 'premiere', 'creative cloud', 'final cut', 'davinci resolve', 'descript', 'filmora', 'camtasia', 'screenflow', 'movavi', 'veed', 'kapwing', 'lumen5', 'pictory', 'capcut']
    },
    youtubeTools: { category: 'YouTube Tools & Analytics', emoji: '📊', scheduleCLine: '27a', deductible: 100, merchants: ['tubebuddy', 'vidiq', 'social blade', 'morning fame', 'tubular', 'creatorhero'] },
    musicLicensing: { category: 'Music & SFX Licensing', emoji: '🎵', scheduleCLine: '27a', deductible: 100, merchants: ['epidemic sound', 'artlist', 'soundstripe', 'envato', 'audiojungle', 'uppbeat'] },
    stockFootage: { category: 'Stock Footage & Assets', emoji: '📹', scheduleCLine: '27a', deductible: 100, merchants: ['storyblocks', 'artgrid', 'pond5', 'motion array'] },
    thumbnailTools: { category: 'Thumbnail & Graphics', emoji: '🎨', scheduleCLine: '27a', deductible: 100, merchants: ['canva', 'photoshop', 'placeit', 'snappa', 'photopea'] },
    equipment: { category: 'Filming Equipment', emoji: '🎥', scheduleCLine: '13', deductible: 100, merchants: ['b&h photo', 'adorama', 'moment', 'elgato', 'rode', 'shure', 'blue yeti', 'focusrite', 'blackmagic', 'sony alpha', 'canon eos', 'logitech'] },
    audioGear: { category: 'Audio Equipment', emoji: '🎤', scheduleCLine: '13', deductible: 100, merchants: ['rode', 'shure', 'blue yeti', 'audio technica', 'focusrite', 'scarlett'] },
    streaming: { category: 'Streaming Tools', emoji: '🔴', scheduleCLine: '27a', deductible: 100, merchants: ['streamyard', 'obs', 'riverside', 'restream', 'vmix', 'ecamm'] },
    utilities: { category: 'Internet & Phone', emoji: '📱', scheduleCLine: '25', deductible: 50, merchants: ['verizon', 'at&t', 'comcast', 'spectrum', 'xfinity', 't-mobile', 'sprint'] },
    creatorEvents: { category: 'Creator Events', emoji: '✈️', scheduleCLine: '27a', deductible: 100, merchants: ['vidcon', 'vidsummit', 'playlist live', 'social media marketing world'] },
    travel: { category: 'Content Travel', emoji: '✈️', scheduleCLine: '24a', deductible: 100, merchants: ['uber', 'lyft', 'delta', 'united', 'american airlines', 'southwest', 'jetblue', 'marriott', 'hilton', 'hyatt', 'airbnb', 'vrbo'] },
    meals: { category: 'Business Meals', emoji: '🍽️', scheduleCLine: '24b', deductible: 50, merchants: ['starbucks', 'chipotle', 'panera', 'sweetgreen', 'uber eats', 'doordash'] },
    creatorServices: { category: 'Creator Services', emoji: '👥', scheduleCLine: '17', deductible: 100, merchants: ['fiverr', 'upwork', '99designs', 'freelancer'] },
    monetization: { category: 'Monetization Platforms', emoji: '💰', scheduleCLine: '27a', deductible: 100, merchants: ['patreon', 'ko-fi', 'buy me a coffee', 'gumroad'] },
    office: { category: 'Office Supplies', emoji: '🏢', scheduleCLine: '18', deductible: 100, merchants: ['staples', 'office depot', 'ikea', 'container store'] }
  };

  const ambiguousMerchants = ['amazon', 'paypal', 'venmo', 'target', 'walmart', 'costco', 'ebay', 'best buy', 'apple'];

  const classifyTransaction = (description, amount) => {
    const lowerDesc = description.toLowerCase();
    for (const merchant of ambiguousMerchants) {
      if (lowerDesc.includes(merchant)) {
        const keywords = ['camera', 'lens', 'tripod', 'microphone', 'mic', 'ring light', 'softbox', 'backdrop', 'green screen', 'capture card', 'stream deck', 'webcam'];
        for (const keyword of keywords) {
          if (lowerDesc.includes(keyword)) return { type: 'ambiguous', merchant, description, amount, detectedKeyword: keyword };
        }
        return { type: 'ambiguous', merchant, description, amount };
      }
    }
    for (const [key, data] of Object.entries(merchantDatabase)) {
      for (const merchant of data.merchants) {
        if (lowerDesc.includes(merchant)) {
          return { type: 'classified', category: data.category, emoji: data.emoji, scheduleCLine: data.scheduleCLine, merchant, description, amount: Math.abs(amount), deductible: data.deductible, deductibleAmount: Math.abs(amount) * (data.deductible / 100) };
        }
      }
    }
    return { type: 'unknown', description, amount };
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].toLowerCase().split(',');
    const dateIdx = headers.findIndex(h => h.includes('date'));
    const descIdx = headers.findIndex(h => h.includes('description') || h.includes('merchant') || h.includes('name'));
    const amountIdx = headers.findIndex(h => h.includes('amount') || h.includes('debit'));
    const parsed = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const amount = parseFloat(values[amountIdx]?.replace(/[^0-9.-]/g, '') || 0);
      if (amount !== 0) parsed.push({ date: values[dateIdx]?.trim(), description: values[descIdx]?.trim(), amount: Math.abs(amount) });
    }
    return parsed;
  };

  const parsePDF = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const typedarray = new Uint8Array(e.target.result);
          const pdfjsLib = window['pdfjs-dist/build/pdf'];
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map(item => item.str).join(' ') + '\n';
          }
          const transactions = [];
          const pattern1 = /(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?)\s+\$?([\d,]+\.\d{2})/g;
          let match;
          while ((match = pattern1.exec(fullText)) !== null) {
            const [_, date, description, amountStr] = match;
            const amount = parseFloat(amountStr.replace(/,/g, ''));
            if (amount > 0 && description.length > 3) transactions.push({ date: date.trim(), description: description.trim().substring(0, 100), amount });
          }
          resolve(transactions);
        } catch { resolve([]); }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const deduplicateTransactions = (txs) => {
    const seen = new Set();
    return txs.filter(tx => {
      const key = `${tx.date}-${tx.description}-${tx.amount}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const handleFileUpload = async (e) => {
    const uploadedFiles = Array.from(e.target.files);
    if (!uploadedFiles.length) return;
    setFiles(uploadedFiles);
    setStep('processing');
    let allTransactions = [];
    for (const file of uploadedFiles) {
      if (file.name.endsWith('.csv')) allTransactions.push(...parseCSV(await file.text()));
      else if (file.name.endsWith('.pdf')) allTransactions.push(...await parsePDF(file));
    }
    allTransactions = deduplicateTransactions(allTransactions);
    setTransactions(allTransactions);
    const needsClarification = [], autoClassified = [], unclassifiedList = [];
    allTransactions.forEach((tx, idx) => {
      const result = classifyTransaction(tx.description, tx.amount);
      if (result.type === 'ambiguous') needsClarification.push({ ...result, index: idx, date: tx.date });
      else if (result.type === 'classified') autoClassified.push({ ...result, date: tx.date });
      else if (result.type === 'unknown') unclassifiedList.push({ ...tx, index: idx });
    });
    setClassified(autoClassified);
    setUnclassified(unclassifiedList);
    if (needsClarification.length) { setClarifications(needsClarification); setCurrentClarification(0); setStep('clarify'); }
    else setStep('results');
  };

  const handleClarification = (isBusinessExpense, categoryKey = null) => {
    const current = clarifications[currentClarification];
    if (isBusinessExpense && categoryKey) {
      const categoryData = merchantDatabase[categoryKey];
      setClassified([...classified, { type: 'classified', category: categoryData.category, emoji: categoryData.emoji, scheduleCLine: categoryData.scheduleCLine, merchant: current.merchant, description: current.description, amount: current.amount, date: current.date, deductible: categoryData.deductible, deductibleAmount: current.amount * (categoryData.deductible / 100) }]);
    }
    if (currentClarification < clarifications.length - 1) setCurrentClarification(currentClarification + 1);
    else setStep('results');
  };

  const handleAddUnclassified = (tx, categoryKey) => {
    const categoryData = merchantDatabase[categoryKey];
    const merchantName = tx.description.split(' ')[0].toLowerCase();
    setClassified([...classified, { type: 'classified', category: categoryData.category, emoji: categoryData.emoji, scheduleCLine: categoryData.scheduleCLine, merchant: merchantName, description: tx.description, amount: tx.amount, date: tx.date, deductible: categoryData.deductible, deductibleAmount: tx.amount * (categoryData.deductible / 100) }]);
    setUnclassified(unclassified.filter(u => u.index !== tx.index));
  };

  const calculateSummary = () => {
    const byCategory = {}, byLine = {};
    let totalDeductions = 0;
    classified.forEach(tx => {
      if (!byCategory[tx.category]) byCategory[tx.category] = { emoji: tx.emoji, scheduleCLine: tx.scheduleCLine, amount: 0, count: 0, transactions: [] };
      byCategory[tx.category].amount += tx.deductibleAmount;
      byCategory[tx.category].count += 1;
      byCategory[tx.category].transactions.push(tx);
      if (!byLine[tx.scheduleCLine]) byLine[tx.scheduleCLine] = { lineName: getLineName(tx.scheduleCLine), amount: 0, categories: [] };
      byLine[tx.scheduleCLine].amount += tx.deductibleAmount;
      if (!byLine[tx.scheduleCLine].categories.includes(tx.category)) byLine[tx.scheduleCLine].categories.push(tx.category);
      totalDeductions += tx.deductibleAmount;
    });
    return { byCategory, byLine, totalDeductions };
  };

  const getLineName = (line) => ({ '8': 'Advertising', '13': 'Depreciation & Section 179', '17': 'Legal & Professional Services', '18': 'Office Expense', '24a': 'Travel', '24b': 'Deductible Meals (50%)', '25': 'Utilities', '27a': 'Other Expenses' }[line] || 'Other Expenses');

  const generateDetailedCSV = () => {
    let csv = 'Date,Merchant,Description,Amount,Category,Schedule C Line,Deductible %,Deductible Amount\n';
    classified.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(tx => {
      csv += `"${tx.date}","${tx.merchant}","${tx.description}",${tx.amount.toFixed(2)},"${tx.category}","${tx.scheduleCLine}",${tx.deductible}%,${tx.deductibleAmount.toFixed(2)}\n`;
    });
    return csv;
  };

  const generateScheduleCSummary = () => {
    const { byLine, totalDeductions } = calculateSummary();
    let summary = `SCHEDULE C EXPENSE SUMMARY - Tax Year 2024\n\nPART II - EXPENSES\n\n`;
    Object.entries(byLine).sort((a, b) => parseFloat(a[0].replace('a', '.1').replace('b', '.2')) - parseFloat(b[0].replace('a', '.1').replace('b', '.2'))).forEach(([line, data]) => {
      summary += `Line ${line} ${data.lineName}: $${data.amount.toFixed(2)}\n`;
    });
    summary += `\nLine 28 TOTAL EXPENSES: $${totalDeductions.toFixed(2)}\n\nGenerated by IDislikeTaxes.com\n`;
    return summary;
  };

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    setEmailCaptured(true);
    localStorage.setItem('userEmail', email);
  };

  const handlePurchase = (tier) => {
    const priceIds = { basic: 'price_1SzQkwBrIdQ3Rgj7X3fZFQpv', lifetime: 'price_1SzQn7BrIdQ3Rgj7I7l7Gppk' };
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 6);
    localStorage.setItem('tier', tier);
    localStorage.setItem('userEmail', email);
    if (tier === 'basic') localStorage.setItem('expiryDate', expiryDate.toISOString());
    const stripe = window.Stripe('pk_test_51OujRkBrIdQ3Rgj70ckp6Zon75kdPscIZog6bWYt19zAy2FbylPRlQ2rjqdL4ecMTw14EeYHshEwCr4jnhT4dbNc00CR217QHx');
    stripe.redirectToCheckout({ lineItems: [{ price: priceIds[tier], quantity: 1 }], mode: 'payment', customerEmail: email, successUrl: window.location.origin + '/success.html', cancelUrl: window.location.origin });
  };

  const canDownload = userTier === 'basic' || userTier === 'lifetime';
  const { byCategory, byLine, totalDeductions } = step === 'results' ? calculateSummary() : { byCategory: {}, byLine: {}, totalDeductions: 0 };
  const estimatedSavings = totalDeductions * 0.393;

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'); * { font-family: 'Inter', sans-serif; }`}</style>
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <Play className="w-5 h-5 text-white" fill="white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">IDislikeTaxes</h1>
              <p className="text-xs text-gray-500">Tax deductions for YouTubers</p>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-12">
        {step === 'upload' && (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <CheckCircle size={16} />
                Built specifically for YouTubers
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Find Every Tax Write-Off</h2>
              <p className="text-xl text-gray-600">Upload your bank statements (CSV or PDF). We'll categorize every YouTube business expense automatically.</p>
            </div>
            <div onClick={() => fileInputRef.current?.click()} className="group border-2 border-dashed border-gray-300 rounded-2xl p-16 text-center hover:border-green-500 hover:bg-green-50 transition-all cursor-pointer bg-white">
              <Upload className="w-16 h-16 text-gray-400 mx-auto mb-6 group-hover:text-green-600 transition-colors" />
              <p className="text-xl font-semibold text-gray-900 mb-2">Upload your files</p>
              <p className="text-sm text-gray-500 mb-4">CSV or PDF • Multiple files supported</p>
              <input ref={fileInputRef} type="file" accept=".csv,.pdf" multiple onChange={handleFileUpload} className="hidden" />
            </div>
          </div>
        )}
        {step === 'processing' && (
          <div className="max-w-md mx-auto text-center py-20">
            <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-6 animate-spin"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyzing transactions...</h2>
          </div>
        )}
        {step === 'results' && (
          <div>
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-8">Your Tax Summary</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="bg-white rounded-xl shadow-sm border p-8">
                  <div className="text-sm font-medium text-gray-500 mb-2">Total Deductions</div>
                  <div className="text-5xl font-bold text-gray-900">${Math.round(totalDeductions).toLocaleString()}</div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-8 text-white">
                  <div className="text-sm font-medium text-green-100 mb-2">Est. Savings</div>
                  <div className="text-5xl font-bold">${Math.round(estimatedSavings).toLocaleString()}</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-8">
                  <div className="text-sm font-medium text-gray-500 mb-2">Transactions</div>
                  <div className="text-5xl font-bold text-gray-900">{classified.length}</div>
                </div>
              </div>
            </div>
            {!emailCaptured ? (
              <div className="bg-white rounded-xl shadow-sm border p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">What We Found:</h2>
                <div className="space-y-4">
                  {Object.entries(byCategory).sort((a, b) => b[1].amount - a[1].amount).map(([category, data]) => (
                    <div key={category} className="border-b border-gray-100 pb-4 last:border-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{data.emoji}</span>
                          <div>
                            <h3 className="font-semibold text-gray-900">{category}</h3>
                            <p className="text-sm text-gray-500">{data.transactions.map(t => t.merchant).filter((v, i, a) => a.indexOf(v) === i).slice(0, 3).join(', ')}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">${data.amount.toFixed(0)}</div>
                          <div className="text-xs text-gray-500">{data.count} transaction{data.count !== 1 ? 's' : ''}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-10 p-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl border">
                  <div className="text-center mb-6">
                    <Mail className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">See Full Breakdown</h2>
                    <p className="text-gray-600">Get Schedule C line numbers + transaction details</p>
                  </div>
                  <form onSubmit={handleEmailSubmit} className="max-w-md mx-auto space-y-3">
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500" />
                    <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg">Continue (Free) →</button>
                  </form>
                </div>
              </div>
            ) : (
              <div>
                <div className="bg-white rounded-xl shadow-sm border p-8 mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2"><FileText className="text-green-600" size={28} />Schedule C Breakdown</h2>
                  <div className="space-y-6">
                    {Object.entries(byLine).sort((a, b) => parseFloat(a[0].replace('a', '.1').replace('b', '.2')) - parseFloat(b[0].replace('a', '.1').replace('b', '.2'))).map(([line, data]) => (
                      <div key={line} className="border-b pb-6 last:border-0">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Schedule C Line {line}</div>
                            <h3 className="text-lg font-semibold text-gray-900">{data.lineName}</h3>
                            <p className="text-sm text-gray-500 mt-1">{data.categories.join(', ')}</p>
                          </div>
                          <div className="text-3xl font-bold text-gray-900">${Math.round(data.amount).toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {!canDownload ? (
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-lg border p-8">
                    <div className="text-center mb-8">
                      <h2 className="text-3xl font-bold text-gray-900 mb-3">Download Your Tax Files</h2>
                      <p className="text-lg text-gray-600">Get Schedule C PDF + CSV to file your taxes</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                      <div className="bg-white rounded-xl border-2 p-6">
                        <div className="text-center mb-4">
                          <div className="text-2xl font-bold text-gray-900 mb-2">6-Month Pass</div>
                          <div className="text-5xl font-bold text-gray-900 mb-2">$27</div>
                        </div>
                        <ul className="space-y-3 mb-6">
                          <li className="flex items-start gap-2 text-sm"><CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} /><span>Upload unlimited 6 months</span></li>
                          <li className="flex items-start gap-2 text-sm"><CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} /><span>Schedule C PDF + CSV</span></li>
                          <li className="flex items-start gap-2 text-sm"><CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} /><span>Filing instructions</span></li>
                        </ul>
                        <button onClick={() => handlePurchase('basic')} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 rounded-lg">Get 6-Month Pass - $27</button>
                      </div>
                      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-xl p-6 text-white relative">
                        <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-lg">LIMITED TIME</div>
                        <div className="text-center mb-4">
                          <div className="text-2xl font-bold mb-2">Lifetime Access</div>
                          <div className="text-5xl font-bold mb-2">$97</div>
                        </div>
                        <ul className="space-y-3 mb-6">
                          <li className="flex items-start gap-2 text-sm"><CheckCircle className="flex-shrink-0 mt-0.5" size={18} /><span>Upload unlimited forever</span></li>
                          <li className="flex items-start gap-2 text-sm"><CheckCircle className="flex-shrink-0 mt-0.5" size={18} /><span>All future features</span></li>
                          <li className="flex items-start gap-2 text-sm"><CheckCircle className="flex-shrink-0 mt-0.5" size={18} /><span>2025, 2026, 2027... lifetime</span></li>
                        </ul>
                        <div className="bg-green-700 rounded-lg p-3 mb-4 text-sm text-center font-semibold">💰 Save $81+ vs annual</div>
                        <button onClick={() => handlePurchase('lifetime')} className="w-full bg-white hover:bg-gray-100 text-green-600 font-bold py-3 rounded-lg">Get Lifetime - $97 →</button>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-8 mt-8 text-sm text-gray-500">
                      <div className="flex items-center gap-2"><Shield size={16} /><span>Secure checkout</span></div>
                      <div className="flex items-center gap-2"><Zap size={16} /><span>Instant access</span></div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg p-8 text-white text-center">
                    <h3 className="text-2xl font-bold mb-3">Download Your Files</h3>
                    <div className="flex gap-4 justify-center">
                      <button onClick={() => downloadFile(generateScheduleCSummary(), 'Schedule-C-2024.txt', 'text/plain')} className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 flex items-center gap-2"><Download size={20} />Schedule C</button>
                      <button onClick={() => downloadFile(generateDetailedCSV(), 'Transactions-2024.csv', 'text/csv')} className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 flex items-center gap-2"><Download size={20} />CSV</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
      <script src="https://js.stripe.com/v3/"></script>
    </div>
  );
};

export default IDislikeTaxes;
