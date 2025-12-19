// File: lib/location-helpers.ts

import { Country, State } from 'country-state-city';

export const getAllCountries = () => {
  return Country.getAllCountries().map((country) => ({
    label: country.name,
    value: country.isoCode,
  }));
};

export const getCountryStateOptions = () => {
  const countries = Country.getAllCountries();
  let options: { label: string; value: string }[] = [];

  countries.forEach((country) => {
    const states = State.getStatesOfCountry(country.isoCode);
    
    if (states.length > 0) {
      states.forEach((state) => {
        options.push({
          label: `${country.name} — ${state.name}`,
          value: `${country.isoCode}:${state.isoCode}`
        });
      });
    } else {
      options.push({
        label: country.name,
        value: country.isoCode
      });
    }
  });

  return options;
};

export const getCountryAndStatesList = (allowedCountryCodes: string[] = []) => {
    let options: { label: string; value: string }[] = [];
    
    let sourceCountries;
    
    if (allowedCountryCodes.length > 0) {
        sourceCountries = allowedCountryCodes
            .map(code => Country.getCountryByCode(code))
            .filter((c): c is any => !!c);
    } else {
        sourceCountries = Country.getAllCountries();
    }

    sourceCountries.forEach((c) => {
        // Add Country
        options.push({
            label: c.name,
            value: c.isoCode
        });

        // Add States
        const states = State.getStatesOfCountry(c.isoCode);
        if (states.length > 0) {
            states.forEach((s) => {
                options.push({
                    label: `${c.name} — ${s.name}`, 
                    value: `${c.isoCode}:${s.isoCode}`
                });
            });
        }
    });

    return options;
};

export const getAllCurrencies = () => {
  const countries = Country.getAllCountries();
  const currencyMap = new Map();

  countries.forEach((country) => {
    if (country.currency) {
      if (!currencyMap.has(country.currency)) {
        try {
          const name = new Intl.DisplayNames(['en'], { type: 'currency' }).of(country.currency);
          
          const symbolPart = new Intl.NumberFormat('en', { style: 'currency', currency: country.currency })
            .formatToParts(1)
            .find(part => part.type === 'currency');
          const symbol = symbolPart ? symbolPart.value : country.currency;

          const label = `${name} (${symbol}) — ${country.currency}`;

          currencyMap.set(country.currency, {
            code: country.currency,
            symbol: symbol,
            label: label
          });
        } catch (e) {
          currencyMap.set(country.currency, {
            code: country.currency,
            symbol: country.currency,
            label: `${country.currency} — ${country.currency}`
          });
        }
      }
    }
  });

  return Array.from(currencyMap.values()).sort((a, b) => a.label.localeCompare(b.label));
};