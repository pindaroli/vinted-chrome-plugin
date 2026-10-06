import React, { useState } from 'react';
import { useProviderConfig } from './hooks/useProviderConfig';
import { useVintedItem } from './hooks/useVintedItem';
import { Header } from './components/Header';
import { ItemCard } from './components/ItemCard';
import { AnalysisControls } from './components/AnalysisControls';
import { AnalysisProgress } from './components/AnalysisProgress';
import { AnalysisResultView } from './components/AnalysisResultView';
import { SettingsTab } from './components/SettingsTab';
import { AnalysisPresetId, AnalysisResult, ImageData } from '../types';
import { AlertCircle, X } from 'lucide-react';

export const App: React.FC = () => {
  const { config, saveConfig, isLoaded: isConfigLoaded } = useProviderConfig();
  const { item, isLoading: isItemLoading, error: itemError, refreshItem } = useVintedItem();

  const [activeTab, setActiveTab] = useState<'analysis' | 'settings'>('analysis');
  const [presetId, setPresetId] = useState<AnalysisPresetId>('full-audit');
  const [customPrompt, setCustomPrompt] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressStep, setProgressStep] = useState('Inizializzazione...');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleStartAnalysis = async () => {
    if (!item) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);

    try {
      // 1. Download & conversione immagini in Base64 tramite background service worker
      setProgressStep('Download e conversione foto in alta risoluzione...');
      const targetImages = (item.imageUrls || []).slice(0, 8); // Max 8 immagini

      const base64Images: ImageData[] = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { type: 'FETCH_IMAGES_BASE64', urls: targetImages },
          (response) => {
            if (response && response.ok && Array.isArray(response.images)) {
              resolve(response.images);
            } else {
              resolve([]);
            }
          }
        );
      });

      // 2. Invio richiesta di analisi multimodale al provider configurato
      setProgressStep(`Invio richiesta a ${config.providerId.toUpperCase()} (${config.modelName})...`);

      const analysisPayload = {
        item,
        images: base64Images,
        presetId,
        customPrompt,
        additionalNotes,
        config,
      };

      const result: AnalysisResult = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          { type: 'ANALYZE_REQUEST', request: analysisPayload },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            if (response && response.ok && response.result) {
              resolve(response.result);
            } else {
              reject(new Error(response?.error || 'Errore imprevisto durante l\'elaborazione AI.'));
            }
          }
        );
      });

      setAnalysisResult(result);
    } catch (err) {
      setAnalysisError((err as Error).message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isConfigLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        config={config}
      />

      <main className="flex-1 p-3 space-y-3 max-w-full overflow-x-hidden">
        {/* Banner di errore analisi */}
        {analysisError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold block">Errore durante l'analisi:</span>
                <span className="leading-snug break-words">{analysisError}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAnalysisError(null)}
              className="text-rose-400 hover:text-rose-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab Analisi */}
        {activeTab === 'analysis' && (
          <div className="space-y-3">
            <ItemCard
              item={item}
              isLoading={isItemLoading}
              error={itemError}
              onRefresh={refreshItem}
            />

            {isAnalyzing && (
              <AnalysisProgress
                stepMessage={progressStep}
                config={config}
              />
            )}

            {!isAnalyzing && analysisResult && item && (
              <AnalysisResultView
                result={analysisResult}
                item={item}
                onReset={() => setAnalysisResult(null)}
              />
            )}

            {!isAnalyzing && !analysisResult && item && (
              <AnalysisControls
                presetId={presetId}
                setPresetId={setPresetId}
                customPrompt={customPrompt}
                setCustomPrompt={setCustomPrompt}
                additionalNotes={additionalNotes}
                setAdditionalNotes={setAdditionalNotes}
                onStartAnalysis={handleStartAnalysis}
                isAnalyzing={isAnalyzing}
                disabled={!item}
              />
            )}
          </div>
        )}

        {/* Tab Impostazioni */}
        {activeTab === 'settings' && (
          <SettingsTab
            initialConfig={config}
            onSaveConfig={saveConfig}
          />
        )}
      </main>
    </div>
  );
};
