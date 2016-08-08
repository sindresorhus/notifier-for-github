(root => {
	'use strict';
	class Option {
		constructor(persistence, options) {
			const {id, valueType, storageKey, onChange} = options;
			this.element = root.document.getElementById(id);
			this.storageKey = storageKey;
			this.valueType = valueType;
			this.PersistenceService = persistence;
			this.element.addEventListener('change', () => {
				onChange(this);
			});
			this.readValue();
		}

		readValue() {
			this.element[this.valueType] = this.PersistenceService.get(this.storageKey);
		}

		writeValue(override) {
			if (override) {
				this.element[this.valueType] = override;
			}
			this.PersistenceService.set(this.storageKey, this.element[this.valueType]);
		}
	}
	root.Option = Option;
})(window);
