import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  description: string | null;
  is_default: number;
}

interface ContributeProps {
  onBack: () => void;
}

export function Contribute({ onBack }: ContributeProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Category creation state
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  
  // Word contribution state
  const [selectedCatId, setSelectedCatId] = useState<number | ''>('');
  const [wordA, setWordA] = useState('');
  const [wordB, setWordB] = useState('');

  // Status alerts
  const [catStatus, setCatStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [wordStatus, setWordStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Load categories
  const loadCategories = () => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        setCategories(data);
        if (data.length > 0 && !selectedCatId) {
          setSelectedCatId(data[0].id);
        }
      })
      .catch(err => console.error('Error fetching categories:', err));
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatStatus(null);
    if (!newCatName.trim()) return;

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName, description: newCatDesc })
      });
      const data = await res.json();
      
      if (res.ok) {
        setCatStatus({ type: 'success', msg: `分类【${data.name}】创建成功！` });
        setNewCatName('');
        setNewCatDesc('');
        loadCategories(); // refresh list
      } else {
        setCatStatus({ type: 'error', msg: data.error || '创建分类失败' });
      }
    } catch (err) {
      setCatStatus({ type: 'error', msg: '网络请求失败，请稍后重试' });
    }
  };

  const handleAddWordPair = async (e: React.FormEvent) => {
    e.preventDefault();
    setWordStatus(null);
    if (!selectedCatId || !wordA.trim() || !wordB.trim()) return;

    try {
      const res = await fetch(`/api/categories/${selectedCatId}/words`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word_a: wordA, word_b: wordB })
      });
      const data = await res.json();

      if (res.ok) {
        setWordStatus({ type: 'success', msg: `成功向分类中添加词组：${wordA} vs ${wordB}` });
        setWordA('');
        setWordB('');
      } else {
        setWordStatus({ type: 'error', msg: data.error || '添加词汇对失败' });
      }
    } catch (err) {
      setWordStatus({ type: 'error', msg: '网络请求失败，请稍后重试' });
    }
  };

  return (
    <div className="min-h-screen bg-[#050811] text-gray-200 p-4 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-8 mt-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-400 transition font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          返回大厅
        </button>
        <h2 className="text-lg font-black text-white uppercase tracking-wider">贡献游戏词库</h2>
        <div className="w-16"></div> {/* Spacer for alignment */}
      </div>

      <div className="w-full max-w-2xl grid md:grid-cols-2 gap-6">
        {/* Box 1: Create category */}
        <div className="glass-card rounded-2xl p-6 border border-slate-900">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-800/80 pb-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">1. 新建词库分类</h3>
          </div>

          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5">词库分类名称</label>
              <input
                type="text"
                placeholder="例如: 舌尖美食、金庸武侠..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value.slice(0, 15))}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5">词库分类描述 (可选)</label>
              <textarea
                placeholder="简单介绍一下这个词库适合哪些人群或主题..."
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value.slice(0, 50))}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition resize-none"
              />
            </div>

            {catStatus && (
              <div className={`p-3 rounded-lg text-2xs flex items-center gap-2 ${
                catStatus.type === 'success' ? 'bg-emerald-950/45 border border-emerald-800/30 text-emerald-400' : 'bg-red-950/45 border border-red-800/30 text-red-400'
              }`}>
                {catStatus.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />}
                <span>{catStatus.msg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl text-xs transition shadow-lg shadow-indigo-600/20"
            >
              创建分类
            </button>
          </form>
        </div>

        {/* Box 2: Contribute word pairs */}
        <div className="glass-card rounded-2xl p-6 border border-slate-900">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-800/80 pb-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">2. 贡献词汇对</h3>
          </div>

          <form onSubmit={handleAddWordPair} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5">选择词库分类</label>
              <select
                value={selectedCatId}
                onChange={(e) => setSelectedCatId(parseInt(e.target.value) || '')}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} {cat.is_default ? '(内置)' : '(用户贡献)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">词汇 A (例如: 苹果)</label>
                <input
                  type="text"
                  placeholder="词汇 A"
                  value={wordA}
                  onChange={(e) => setWordA(e.target.value.slice(0, 10))}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">词汇 B (例如: 梨子)</label>
                <input
                  type="text"
                  placeholder="与词汇 A 相似的词"
                  value={wordB}
                  onChange={(e) => setWordB(e.target.value.slice(0, 10))}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            {wordStatus && (
              <div className={`p-3 rounded-lg text-2xs flex items-center gap-2 ${
                wordStatus.type === 'success' ? 'bg-emerald-950/45 border border-emerald-800/30 text-emerald-400' : 'bg-red-950/45 border border-red-800/30 text-red-400'
              }`}>
                {wordStatus.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />}
                <span>{wordStatus.msg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs transition shadow-lg shadow-emerald-600/20"
            >
              提交词组
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
