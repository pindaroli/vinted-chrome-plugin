import React, { useState, useEffect } from 'react';
import { ProviderConfig, ProviderType } from '../../types';
import { useModelList } from '../hooks/useModelList';
import {
  RotateCw,
  Eye,
  EyeOff,
  Save,
  Check,
  Zap,
  Server,
  KeyRound,
  Sliders,
  Globe
} from 'lucide-react';

interface SettingsTabProps {
  initialConfig: ProviderConfig;
  onSaveConfig: (config: ProviderConfig) => Promise<void>;
}

const PRESET_TEMPLATES: Record<
  string,
  { label: string; desc: string; providerId: ProviderType; baseUrl: string; modelName: string }
> = {
  gemini: {
    label: 'Google Gemini',
    desc: 'gemini-2.5-flash (Cloud)',
    providerId: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    modelName: 'gemini-2.5-flash',
  },
  openai: {
    label: 'OpenAI Cloud',
    desc: 'gpt-4o-mini (Cloud)',
    providerId: 'openai-compatible',
    baseUrl: 'https://api.openai.com/v1',
    modelName: 'gpt-4o-mini',
  },
  ollama: {
    label: 'Ollama Locale',
    desc: 'qwen2.5-vl:7b (11434)',
    providerId: 'openai-compatible',
    baseUrl: 'http://localhost:11434/v1',
    modelName: 'qwen2.5-vl:7b',
  },
  lmstudio: {
    label: 'LM Studio Locale',
    desc: 'qwen2.5-vl (1234)',
    providerId: 'openai-compatible',
    baseUrl: 'http://localhost:1234/v1',
    modelName: 'qwen2.5-vl',
  },
};

export const SettingsTab: React.FC<SettingsTabProps> = ({ initialConfig, onSaveConfig }) => {
  const [providerId, setProviderId] = useState<ProviderType>(initialConfig.providerId);
  const [baseUrl, setBaseUrl] = useState(initialConfig.baseUrl);
  const [modelName, setModelName] = useState(initialConfig.modelName);
  const [apiKey, setApiKey] = useState(initialConfig.apiKey);
  const [temperature, setTemperature] = useState(initialConfig.temperature ?? 0.2);

  const [showApiKey, setShowApiKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sincronizza lo stato locale se initialConfig cambia
  useEffect(() => {
    setProviderId(initialConfig.providerId);
    setBaseUrl(initialConfig.baseUrl);
    setModelName(initialConfig.modelName);
    setApiKey(initialConfig.apiKey);
    setTemperature(initialConfig.temperature ?? 0.2);
  }, [initialConfig]);

  // Hook per listing dinamico dei modelli
  const { models, isLoading: isLoadingModels, error: modelsError, refreshModels } = useModelList(
    providerId,
    baseUrl,
    apiKey,
    modelName,
    (chosenModel) => setModelName(chosenModel)
  );

  const applyPreset = (key: string) => {
    const p = PRESET_TEMPLATES[key];
    if (!p) return;
    setProviderId(p.providerId);
    setBaseUrl(p.baseUrl);
    setModelName(p.modelName);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveConfig({
      providerId,
      baseUrl: baseUrl.trim(),
      modelName: modelName.trim(),
      apiKey: apiKey.trim(),
      temperature,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const isLocal = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Preset Rapidi */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" />
          Template di Configurazione Rapida
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {Object.entries(PRESET_TEMPLATES).map(([key, item]) => (
            <button
              key={key}
              type="button"
              onClick={() => applyPreset(key)}
              className="p-2 rounded-lg bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 text-left transition flex flex-col group"
            >
              <span className="text-xs font-semibold text-slate-200 group-hover:text-sky-400">
                {item.label}
              </span>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                {item.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Form Campi Principali */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-3">
        {/* Provider Type */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1">
            <Server className="w-3 h-3 text-sky-400" />
            Tipo di Provider AI
          </label>
          <select
            value={providerId}
            onChange={(e) => setProviderId(e.target.value as ProviderType)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 focus:outline-hidden rounded-lg p-2 text-xs text-slate-200 transition"
          >
            <option value="gemini">Google Gemini (REST Ufficiale v1beta)</option>
            <option value="openai-compatible">OpenAI-Compatible (OpenAI, Ollama, LM Studio)</option>
            <option value="custom-http">Custom HTTP Server / Webhook</option>
          </select>
        </div>

        {/* Base URL */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1">
            <Globe className="w-3 h-3 text-sky-400" />
            Base URL Endpoint
          </label>
          <input
            type="url"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            required
            placeholder="https://..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 focus:outline-hidden rounded-lg p-2 text-xs text-slate-200 font-mono transition"
          />
          <p className="text-[10px] text-slate-500 leading-snug">
            {providerId === 'gemini' && 'Default: https://generativelanguage.googleapis.com/v1beta'}
            {providerId === 'openai-compatible' && isLocal && 'Default Ollama: http://localhost:11434/v1 | LM Studio: http://localhost:1234/v1'}
            {providerId === 'openai-compatible' && !isLocal && 'Default OpenAI: https://api.openai.com/v1'}
            {providerId === 'custom-http' && 'Endpoint server webhook personalizzato'}
          </p>
        </div>

        {/* Nome Modello Multimodale: DROPDOWN PULL-DOWN DINAMICO */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <Sliders className="w-3 h-3 text-teal-400" />
              Nome Modello Multimodale
            </label>
            {providerId !== 'custom-http' && (
              <span className="text-[9px] text-slate-500">
                {isLoadingModels
                  ? 'Caricamento modelli...'
                  : models.length > 0
                  ? `${models.length} modelli rilevati`
                  : ''}
              </span>
            )}
          </div>

          <div className="flex gap-1.5">
            {providerId === 'custom-http' ? (
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                required
                placeholder="es. custom-model"
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-sky-500 focus:outline-hidden rounded-lg p-2 text-xs text-slate-200 font-mono transition"
              />
            ) : (
              <select
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-sky-500 focus:outline-hidden rounded-lg p-2 text-xs text-slate-200 font-mono transition truncate"
              >
                {models.length > 0 ? (
                  models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))
                ) : (
                  <option value={modelName}>{modelName || 'Nessun modello disponibile'}</option>
                )}
              </select>
            )}

            {providerId !== 'custom-http' && (
              <button
                type="button"
                onClick={() => refreshModels()}
                disabled={isLoadingModels}
                title="Ricarica elenco modelli dal provider"
                className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition shrink-0"
              >
                <RotateCw className={`w-4 h-4 ${isLoadingModels ? 'animate-spin text-sky-400' : ''}`} />
              </button>
            )}
          </div>

          {modelsError && (
            <p className="text-[10px] text-amber-400 leading-snug">
              Impossibile caricare l'elenco modelli: {modelsError}
            </p>
          )}
          {!modelsError && providerId !== 'custom-http' && (
            <p className="text-[10px] text-slate-500 leading-snug">
              Per Ollama / LM Studio assicurati di scegliere un modello con supporto Vision (es. <code className="text-slate-400">qwen2.5-vl:7b</code>, <code className="text-slate-400">llava</code>).
            </p>
          )}
        </div>

        {/* API Key */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1">
            <KeyRound className="w-3 h-3 text-sky-400" />
            API Key
          </label>
          <div className="flex gap-1.5">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Inserisci API Key..."
              className="flex-1 bg-slate-950 border border-slate-800 focus:border-sky-500 focus:outline-hidden rounded-lg p-2 text-xs text-slate-200 font-mono transition"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              title={showApiKey ? 'Nascondi API Key' : 'Mostra API Key'}
              className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition shrink-0"
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-slate-500 leading-snug">
            {providerId === 'gemini' && 'Obbligatoria per Google Gemini API.'}
            {providerId === 'openai-compatible' && isLocal && 'Opzionale / non richiesta per istanze locali (Ollama/LM Studio).'}
            {providerId === 'openai-compatible' && !isLocal && 'Obbligatoria per OpenAI Cloud.'}
            {providerId === 'custom-http' && 'Inviata come header Bearer se specificata.'}
          </p>
        </div>

        {/* Temperature */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">
              Temperature (Creatività / Precisione)
            </label>
            <span className="text-xs font-mono font-bold text-sky-400">{temperature.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="w-full accent-sky-500 cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-slate-500 font-mono">
            <span>0.0 (Massima Precisione)</span>
            <span>1.0 (Creativo)</span>
          </div>
        </div>
      </div>

      {/* Salva button */}
      <div className="space-y-2">
        <button
          type="submit"
          className="w-full py-2.5 px-4 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-sky-500/25 active:scale-[0.99]"
        >
          <Save className="w-4 h-4" />
          Salva Impostazioni
        </button>

        {saveSuccess && (
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-center gap-1.5 animate-in fade-in">
            <Check className="w-4 h-4" />
            Configurazione salvata con successo!
          </div>
        )}
      </div>
    </form>
  );
};
