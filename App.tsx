import React, { useState, useCallback, useEffect } from 'react';
import { TONES } from './constants';
import type { Tone } from './types';
import { generateTextInTone } from './services/geminiService';
import { SparklesIcon, CopyIcon, CheckIcon, TrashIcon } from './components/icons';

interface ToneCardProps {
  tone: Tone;
  isSelected: boolean;
  onSelect: (tone: Tone) => void;
  isCustom: boolean;
  onDelete?: (toneName: string) => void;
}

const ToneCard = ({ tone, isSelected, onSelect, isCustom, onDelete }: ToneCardProps) => (
    <div
      onClick={() => onSelect(tone)}
      className={`
        relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-300
        ${isSelected ? 'border-indigo-500 bg-indigo-900/50 shadow-lg scale-105' : 'border-gray-700 bg-gray-800 hover:border-indigo-600 hover:bg-gray-700/50'}
      `}
    >
        <div className="flex justify-between items-start mb-1">
            <h3 className="text-lg font-semibold text-white pr-2 break-words">{tone.name}</h3>
            {isCustom && (
                <div className="flex-shrink-0 flex items-center space-x-2">
                    <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">Custom</span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent card selection when deleting
                            onDelete?.(tone.name);
                        }}
                        className="text-gray-500 hover:text-red-400 p-1 rounded-full hover:bg-gray-700 transition-colors"
                        title="Delete tone"
                        aria-label={`Delete ${tone.name} tone`}
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
      <p className="text-sm text-gray-400 mt-1 line-clamp-3">{tone.description}</p>
    </div>
);


const App: React.FC = () => {
    const [selectedTone, setSelectedTone] = useState<Tone | null>(null);
    const [customTones, setCustomTones] = useState<Tone[]>([]);
    const [inputText, setInputText] = useState<string>('');
    const [outputText, setOutputText] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [isCopied, setIsCopied] = useState<boolean>(false);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTone, setNewTone] = useState({ name: '', description: '' });
    const [formError, setFormError] = useState('');

    useEffect(() => {
        try {
            const savedTones = localStorage.getItem('customTones');
            if (savedTones) {
                setCustomTones(JSON.parse(savedTones));
            }
        } catch (error) {
            console.error("Failed to load custom tones from localStorage", error);
            localStorage.removeItem('customTones');
        }
    }, []);

    const handleSaveCustomTone = () => {
        if (!newTone.name.trim() || !newTone.description.trim()) {
            setFormError('Both name and description are required.');
            return;
        }
        if ([...TONES, ...customTones].some(tone => tone.name.toLowerCase() === newTone.name.trim().toLowerCase())) {
            setFormError('A tone with this name already exists.');
            return;
        }

        const updatedTones = [...customTones, { name: newTone.name.trim(), description: newTone.description.trim() }];
        setCustomTones(updatedTones);
        localStorage.setItem('customTones', JSON.stringify(updatedTones));
        
        setIsModalOpen(false);
        setNewTone({ name: '', description: '' });
        setFormError('');
    };
    
    const handleDeleteCustomTone = (toneName: string) => {
        if (window.confirm(`Are you sure you want to delete the "${toneName}" tone? This cannot be undone.`)) {
            const updatedTones = customTones.filter(tone => tone.name !== toneName);
            setCustomTones(updatedTones);
            localStorage.setItem('customTones', JSON.stringify(updatedTones));

            if (selectedTone?.name === toneName) {
                setSelectedTone(null);
            }
        }
    };

    const handleGenerate = useCallback(async () => {
        if (!selectedTone || !inputText) {
            setError('Please select a tone and enter some text.');
            return;
        }
        setIsLoading(true);
        setError('');
        setOutputText('');
        try {
            const result = await generateTextInTone(inputText, selectedTone);
            setOutputText(result);
        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [inputText, selectedTone]);

    const handleCopy = useCallback(() => {
        if (!outputText) return;
        navigator.clipboard.writeText(outputText);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }, [outputText]);

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
                        AI Tone Shifter
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg">Choose a voice, enter your text, and let AI rewrite it for you.</p>
                </header>

                <main>
                    <section id="tone-selection" className="mb-10">
                        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                             <h2 className="text-2xl font-semibold text-white">1. Select a Tone</h2>
                             <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-md">
                                + Add Custom Tone
                             </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {TONES.map(tone => (
                                <ToneCard
                                    key={tone.name}
                                    tone={tone}
                                    isSelected={selectedTone?.name === tone.name}
                                    // FIX: Resolve type mismatch on the `onSelect` prop by wrapping `setSelectedTone` in a lambda, ensuring type compatibility.
                                    onSelect={(tone) => setSelectedTone(tone)}
                                    isCustom={false}
                                />
                            ))}
                            {customTones.map(tone => (
                                <ToneCard
                                    key={tone.name}
                                    tone={tone}
                                    isSelected={selectedTone?.name === tone.name}
                                    // FIX: Resolve type mismatch on the `onSelect` prop by wrapping `setSelectedTone` in a lambda, ensuring type compatibility.
                                    onSelect={(tone) => setSelectedTone(tone)}
                                    isCustom={true}
                                    onDelete={handleDeleteCustomTone}
                                />
                            ))}
                        </div>
                    </section>

                    <section id="text-input" className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4 text-white">2. Enter Your Text</h2>
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Type or paste your text here..."
                            className="w-full h-40 p-4 bg-gray-800 border-2 border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 resize-none"
                            aria-label="Text input"
                        />
                    </section>

                    <section id="generate-action" className="text-center mb-8">
                        <button
                            onClick={handleGenerate}
                            disabled={!selectedTone || !inputText || isLoading}
                            className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="w-5 h-5 mr-2" />
                                    Generate
                                </>
                            )}
                        </button>
                    </section>

                    {error && (
                        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center mb-8">
                            <p>{error}</p>
                        </div>
                    )}

                    <section id="output" className="min-h-[10rem]">
                        <h2 className="text-2xl font-semibold mb-4 text-white">3. Generated Text</h2>
                        <div className="relative w-full p-4 bg-gray-800 border-2 border-gray-700 rounded-lg min-h-[16rem] whitespace-pre-wrap">
                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50 backdrop-blur-sm rounded-lg">
                                    <div className="text-center">
                                      <p className="text-lg">AI is thinking...</p>
                                      <p className="text-sm text-gray-400">This might take a moment.</p>
                                    </div>
                                </div>
                            )}
                            <p className="text-gray-300">{outputText}</p>
                            {outputText && !isLoading && (
                                <button
                                    onClick={handleCopy}
                                    className="absolute top-3 right-3 p-2 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
                                    title="Copy to clipboard"
                                >
                                    {isCopied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
                                </button>
                            )}
                        </div>
                    </section>
                </main>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true">
                    <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg border border-gray-700">
                        <h3 className="text-xl font-semibold mb-4">Create Custom Tone</h3>
                        <div className="space-y-4">
                            <input
                                type="text"
                                value={newTone.name}
                                onChange={(e) => setNewTone({ ...newTone, name: e.target.value })}
                                placeholder="Tone Name (e.g., 'Shakespearean Scholar')"
                                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                             <textarea
                                value={newTone.description}
                                onChange={(e) => setNewTone({ ...newTone, description: e.target.value })}
                                placeholder="Describe the tone, style, and voice... The more detailed, the better."
                                rows={5}
                                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                            />
                        </div>
                        {formError && <p className="text-red-400 text-sm mt-3">{formError}</p>}
                        <div className="flex justify-end space-x-3 mt-6">
                            <button 
                                onClick={() => { setIsModalOpen(false); setFormError(''); }}
                                className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveCustomTone}
                                className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                Save Tone
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default App;
