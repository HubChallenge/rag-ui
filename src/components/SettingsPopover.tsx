interface SettingsPopoverProps {
  models: string[];
  selectedModel: string;
  onSelectModel: (model: string) => void;
  disabled?: boolean;
}

export function SettingsPopover({ models, selectedModel, onSelectModel, disabled }: SettingsPopoverProps) {
  return (
    <div className="settings-popover" role="dialog" aria-label="Réglages">
      <div className="settings">
        <label>
          Modèle
          {models.length > 0 ? (
            <select
              value={selectedModel}
              disabled={disabled}
              onChange={(e) => onSelectModel(e.target.value)}
            >
              {models.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          ) : (
            <input value={selectedModel} disabled placeholder="Aucun modèle détecté" readOnly />
          )}
        </label>
      </div>
    </div>
  );
}
