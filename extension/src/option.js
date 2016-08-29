'use strict';

import PersistenceService from './persistence-service';

class Option {
	constructor(options) {
		const {id, valueType, storageKey, onChange} = options;
		this.element = document.getElementById(id);
		this.storageKey = storageKey;
		this.valueType = valueType;
		this.element.addEventListener('change', () => {
			onChange(this);
		});
		this.readValue();
	}

	readValue() {
		this.element[this.valueType] = PersistenceService.get(this.storageKey);
	}

	writeValue(override) {
		if (override) {
			this.element[this.valueType] = override;
		}
		PersistenceService.set(this.storageKey, this.element[this.valueType]);
	}
}

export default Option;
