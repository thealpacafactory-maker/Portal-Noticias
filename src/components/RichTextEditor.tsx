'use client';

import React, { useRef, useEffect, useState } from 'react';
import {
  Heading2,
  Heading3,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Code,
  Eye,
  RotateCcw,
  AlignLeft,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder = 'Escribe aquí la noticia...' }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showCodeMode, setShowCodeMode] = useState(false);
  const [htmlCode, setHtmlCode] = useState(value);

  // Sync value from props initially or when changed externally
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
    setHtmlCode(value || '');
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setHtmlCode(html);
      onChange(html);
    }
  };

  const executeCommand = (command: string, value: string | undefined = undefined) => {
    if (showCodeMode) return;
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  const insertHeading = (tag: 'h2' | 'h3' | 'p') => {
    if (showCodeMode) return;
    executeCommand('formatBlock', `<${tag}>`);
  };

  const insertLink = () => {
    if (showCodeMode) return;
    const url = prompt('Ingresa la URL del enlace:');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  const insertImage = () => {
    if (showCodeMode) return;
    const url = prompt('Ingresa la URL de la imagen a insertar:');
    if (url) {
      executeCommand('insertImage', url);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setHtmlCode(val);
    onChange(val);
    if (editorRef.current) {
      editorRef.current.innerHTML = val;
    }
  };

  return (
    <div className="border border-slate-700/80 bg-slate-900 rounded-2xl overflow-hidden shadow-lg focus-within:border-blue-500 transition-all">
      {/* Editor Toolbar */}
      <div className="bg-slate-950 border-b border-slate-800 p-2.5 flex flex-wrap items-center gap-1 text-slate-300 select-none">
        {/* Block Types */}
        <div className="flex items-center space-x-1 border-r border-slate-800 pr-2 mr-1">
          <button
            type="button"
            onClick={() => insertHeading('h2')}
            title="Título Secundario (H2)"
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-xs font-semibold"
          >
            <Heading2 className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">Título H2</span>
          </button>

          <button
            type="button"
            onClick={() => insertHeading('h3')}
            title="Subtítulo (H3)"
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-xs font-semibold"
          >
            <Heading3 className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">Subtítulo H3</span>
          </button>

          <button
            type="button"
            onClick={() => insertHeading('p')}
            title="Párrafo normal"
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-xs"
          >
            <AlignLeft className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Párrafo</span>
          </button>
        </div>

        {/* Text Formats */}
        <div className="flex items-center space-x-1 border-r border-slate-800 pr-2 mr-1">
          <button
            type="button"
            onClick={() => executeCommand('bold')}
            title="Negrita (Ctrl+B)"
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('italic')}
            title="Cursiva (Ctrl+I)"
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('underline')}
            title="Subrayado"
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
          >
            <Underline className="w-4 h-4" />
          </button>
        </div>

        {/* Lists & Quotes */}
        <div className="flex items-center space-x-1 border-r border-slate-800 pr-2 mr-1">
          <button
            type="button"
            onClick={() => executeCommand('insertUnorderedList')}
            title="Lista con Viñetas"
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('insertOrderedList')}
            title="Lista Numerada"
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('formatBlock', '<blockquote>')}
            title="Cita Destacada"
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
          >
            <Quote className="w-4 h-4 text-amber-400" />
          </button>
        </div>

        {/* Links & Media */}
        <div className="flex items-center space-x-1 border-r border-slate-800 pr-2 mr-1">
          <button
            type="button"
            onClick={insertLink}
            title="Insertar Enlace"
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
          >
            <LinkIcon className="w-4 h-4 text-emerald-400" />
          </button>
          <button
            type="button"
            onClick={insertImage}
            title="Insertar Imagen"
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
          >
            <ImageIcon className="w-4 h-4 text-purple-400" />
          </button>
        </div>

        {/* Clean & Mode Toggle */}
        <div className="flex items-center space-x-1 ml-auto">
          <button
            type="button"
            onClick={() => executeCommand('removeFormat')}
            title="Limpiar Formato"
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowCodeMode(!showCodeMode)}
            title={showCodeMode ? 'Ver Editor Visual' : 'Ver Código HTML'}
            className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
              showCodeMode ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {showCodeMode ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Vista Visual</span>
              </>
            ) : (
              <>
                <Code className="w-3.5 h-3.5" />
                <span>Código HTML</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      {showCodeMode ? (
        <textarea
          value={htmlCode}
          onChange={handleCodeChange}
          className="w-full h-80 bg-slate-950 text-slate-200 p-4 font-mono text-sm border-0 focus:outline-none resize-y"
          placeholder="Código HTML generado..."
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="w-full min-h-[320px] p-6 text-slate-100 text-base focus:outline-none prose prose-invert max-w-none prose-h2:text-blue-300 prose-h2:font-bold prose-h2:mt-6 prose-h2:mb-3 prose-h3:text-sky-300 prose-h3:font-semibold prose-p:leading-relaxed prose-p:mb-4 prose-a:text-blue-400 prose-a:underline prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6 prose-blockquote:border-l-4 prose-blockquote:border-amber-400 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-300"
          data-placeholder={placeholder}
        />
      )}

      {/* Bottom status */}
      <div className="bg-slate-950 border-t border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-500 font-mono">
        <span>El editor genera la estructura HTML automáticamente</span>
        <span>{htmlCode.length} caracteres</span>
      </div>
    </div>
  );
}
