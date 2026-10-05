'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Terminal, Layers, Globe, GitBranch } from 'lucide-react';

export default function NewProjectModal({ isOpen, onClose, onCreateProject }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [environment, setEnvironment] = useState('production');
  const [repo, setRepo] = useState('');
  const [selectedServices, setSelectedServices] = useState(['web', 'api']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const serviceOptions = [
    { id: 'web', name: 'Web Frontend', type: 'web', tech: 'Next.js 15' },
    { id: 'api', name: 'API Gateway', type: 'web', tech: 'Go / Rust' },
    { id: 'worker', name: 'Background Worker', type: 'worker', tech: 'Node.js' },
    { id: 'stream', name: 'Event Ingest', type: 'worker', tech: 'Kafka / Redis' },
  ];

  const toggleService = (id) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);

    const id = `proj_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36)}`;
    const newProj = {
      id,
      name: name.trim(),
      description: description.trim() || 'Edge runtime application workspace',
      environment,
      status: 'healthy',
      services: selectedServices.map((sid) => {
        const opt = serviceOptions.find((o) => o.id === sid);
        return {
          id: `svc_${sid}_${Date.now().toString(36)}`,
          name: opt ? opt.id : sid,
          type: opt ? opt.type : 'web',
        };
      }),
      currentDeployment: {
        version: 'v1.0.0',
        commit: Math.random().toString(16).substring(2, 9),
        status: 'live',
        timestamp: 'Just now',
        branch: 'main',
      },
      url: `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.kr0n.dev`,
      resources: { cpu: Math.floor(Math.random() * 25) + 5, memory: '0.8 GB' },
      deploymentCount: 1,
      updatedAt: 'Just now',
      position: {
        x: 180 + (Math.random() * 300),
        y: 120 + (Math.random() * 200),
      },
      linkedTo: null,
    };

    setTimeout(() => {
      onCreateProject(newProj);
      setIsSubmitting(false);
      onClose();
      setName('');
      setDescription('');
    }, 400);
  };

  return (
    <AnimatePresence>
      <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md'>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2 }}
          className='w-full max-w-lg bg-kr0n-surface border border-kr0n-line shadow-2xl relative overflow-hidden'
        >
          {/* Header */}
          <div className='flex items-center justify-between px-6 py-4 border-b border-kr0n-line bg-kr0n-canvas-raised/80'>
            <div className='flex items-center gap-3'>
              <div className='w-2 h-2 bg-white rounded-none' />
              <span className='text-xs font-mono uppercase tracking-widest text-white font-bold'>
                Create Application Project
              </span>
            </div>
            <button
              type='button'
              onClick={onClose}
              className='text-kr0n-faint hover:text-white transition-colors p-1'
            >
              <X size={16} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className='p-6 space-y-5'>
            {/* Project Name */}
            <div className='space-y-1.5'>
              <label className='block text-[11px] font-mono uppercase tracking-wider text-kr0n-muted'>
                Project Name <span className='text-white'>*</span>
              </label>
              <input
                type='text'
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='e.g. Hyperion Core'
                className='w-full bg-kr0n-black border border-kr0n-line hover:border-kr0n-line-strong focus:border-white px-3.5 py-2 text-xs font-mono text-white placeholder-kr0n-faint outline-none transition-colors'
              />
            </div>

            {/* Description */}
            <div className='space-y-1.5'>
              <label className='block text-[11px] font-mono uppercase tracking-wider text-kr0n-muted'>
                Description
              </label>
              <input
                type='text'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='e.g. Distributed vector index and edge ingestion'
                className='w-full bg-kr0n-black border border-kr0n-line hover:border-kr0n-line-strong focus:border-white px-3.5 py-2 text-xs text-white placeholder-kr0n-faint outline-none transition-colors'
              />
            </div>

            {/* Environment */}
            <div className='space-y-1.5'>
              <label className='block text-[11px] font-mono uppercase tracking-wider text-kr0n-muted'>
                Target Environment
              </label>
              <div className='grid grid-cols-3 gap-2'>
                {['production', 'staging', 'preview'].map((env) => (
                  <button
                    key={env}
                    type='button'
                    onClick={() => setEnvironment(env)}
                    className={`py-2 px-3 text-[10px] font-mono uppercase tracking-wider border text-center transition-all ${
                      environment === env
                        ? 'border-white bg-white/10 text-white font-bold'
                        : 'border-kr0n-line bg-kr0n-black/50 text-kr0n-muted hover:text-white hover:border-kr0n-line-strong'
                    }`}
                  >
                    {env}
                  </button>
                ))}
              </div>
            </div>

            {/* Services selection */}
            <div className='space-y-2'>
              <label className='block text-[11px] font-mono uppercase tracking-wider text-kr0n-muted'>
                Initial Services
              </label>
              <div className='grid grid-cols-2 gap-2'>
                {serviceOptions.map((opt) => {
                  const isChecked = selectedServices.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type='button'
                      onClick={() => toggleService(opt.id)}
                      className={`p-2.5 border text-left flex items-start justify-between transition-all ${
                        isChecked
                          ? 'border-white/40 bg-white/[0.04]'
                          : 'border-kr0n-line-soft bg-kr0n-black/40 hover:border-kr0n-line'
                      }`}
                    >
                      <div>
                        <div className='text-xs font-mono text-white font-medium'>
                          {opt.name}
                        </div>
                        <div className='text-[10px] font-mono text-kr0n-faint'>
                          {opt.tech}
                        </div>
                      </div>
                      <span
                        className={`w-3.5 h-3.5 border flex items-center justify-center text-[9px] mt-0.5 ${
                          isChecked
                            ? 'border-white bg-white text-black font-bold'
                            : 'border-kr0n-line'
                        }`}
                      >
                        {isChecked && '✓'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className='pt-3 border-t border-kr0n-line flex items-center justify-end gap-3'>
              <button
                type='button'
                onClick={onClose}
                className='px-4 py-2 text-xs font-mono uppercase tracking-wider text-kr0n-muted hover:text-white transition-colors'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={isSubmitting || !name.trim()}
                className='clipped-btn inline-flex items-center gap-2 bg-white hover:bg-neutral-200 text-black px-5 py-2 text-xs font-mono uppercase tracking-wider font-bold transition-colors disabled:opacity-50'
              >
                {isSubmitting ? (
                  <>
                    <span className='w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin' />
                    Spawning...
                  </>
                ) : (
                  <>
                    <Plus size={13} />
                    Spawn Project
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
