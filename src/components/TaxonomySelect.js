// @ts-check
import React, { useDeferredValue, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles/commonStyles';

/**
 * @param {import('../types/swapTypes').SwapTaxonomySelectProps} props
 */
export const TaxonomySelect = ({
  taxonomyName = 'Taxonomy',
  options = [],
  selectedId = '',
  onSelect,
  searchable = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const deferredSearchText = useDeferredValue(searchText);

  const selectedOption = useMemo(
    () => (Array.isArray(options) ? options.find((option) => option?.id === selectedId) || null : null),
    [options, selectedId]
  );
  const filteredOptions = useMemo(() => {
    if (!Array.isArray(options)) {
      return [];
    }

    const query = String(deferredSearchText || '').trim().toLowerCase();
    if (!query) {
      return options;
    }

    return options.filter((option) => String(option?.name || '').toLowerCase().includes(query));
  }, [deferredSearchText, options]);
  const visibleOptions = useMemo(
    () => (searchable ? filteredOptions.slice(0, 50) : filteredOptions),
    [filteredOptions, searchable]
  );

  return (
    <View style={[styles.selectField, isOpen && styles.selectFieldOpen]}>
      <Text style={styles.selectLabel}>{taxonomyName}</Text>
      <TouchableOpacity
        onPress={() => {
          setIsOpen((current) => !current);
          if (isOpen) {
            setSearchText('');
          }
        }}
        style={[styles.selectTrigger, isOpen && styles.selectTriggerActive]}
      >
        <Text style={[styles.selectTriggerValue, !selectedOption?.name && styles.selectTriggerPlaceholder]}>
          {selectedOption?.name || `Select ${taxonomyName.toLowerCase()}`}
        </Text>
        <Text style={styles.selectTriggerIcon}>{isOpen ? 'Hide' : 'Select'}</Text>
      </TouchableOpacity>

      {isOpen ? (
        <>
          <Pressable
            style={styles.dropdownBackdrop}
            onPress={() => {
              setIsOpen(false);
              setSearchText('');
            }}
          />
          <View style={styles.dropdownMenu}>
            {searchable ? (
              <View style={styles.dropdownSearchWrap}>
                <TextInput
                  value={searchText}
                  onChangeText={setSearchText}
                  placeholder={`Type ${taxonomyName.toLowerCase()}`}
                  placeholderTextColor="#94a3b8"
                  style={styles.dropdownSearchInput}
                  autoFocus
                />
              </View>
            ) : null}
            <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" contentContainerStyle={styles.dropdownScrollContent}>
              {visibleOptions.length === 0 ? (
                <View style={styles.dropdownEmptyState}>
                  <Text style={styles.dropdownEmptyText}>No matches</Text>
                </View>
              ) : (
                <>
                  {visibleOptions.map((item, index) => {
                    const itemSelected = selectedId === item?.id;
                    const isLast = index === visibleOptions.length - 1;

                    return (
                      <TouchableOpacity
                        key={String(item?.id || '')}
                        onPress={() => {
                          onSelect?.(item?.id || '');
                          setSearchText('');
                          setIsOpen(false);
                        }}
                        style={[
                          styles.dropdownOptionButton,
                          itemSelected && styles.dropdownOptionButtonActive,
                          isLast && styles.dropdownOptionButtonLast,
                        ]}
                      >
                        <Text style={[styles.dropdownOptionText, itemSelected && styles.dropdownOptionTextActive]}>{item?.name || ''}</Text>
                      </TouchableOpacity>
                    );
                  })}
                  {searchable && filteredOptions.length > visibleOptions.length ? (
                    <View style={styles.dropdownEmptyState}>
                      <Text style={styles.dropdownEmptyText}>Showing first {visibleOptions.length} matches. Keep typing to narrow.</Text>
                    </View>
                  ) : null}
                </>
              )}
            </ScrollView>
          </View>
        </>
      ) : null}
    </View>
  );
};
