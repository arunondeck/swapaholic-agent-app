// @ts-check
import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
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
  const [isFocused, setIsFocused] = useState(false);

  const dropdownOptions = useMemo(
    () =>
      (Array.isArray(options) ? options : []).map((option) => ({
        id: String(option?.id || ''),
        name: String(option?.name || ''),
      })),
    [options]
  );

  return (
    <View style={styles.selectField}>
      <Text style={styles.selectLabel}>{taxonomyName}</Text>
      <Dropdown
        style={[styles.taxonomyDropdown, isFocused && styles.taxonomyDropdownFocused]}
        containerStyle={styles.taxonomyDropdownContainer}
        placeholderStyle={styles.taxonomyDropdownPlaceholder}
        selectedTextStyle={styles.taxonomyDropdownSelectedText}
        inputSearchStyle={styles.taxonomyDropdownSearchInput}
        itemContainerStyle={styles.taxonomyDropdownItemContainer}
        itemTextStyle={styles.taxonomyDropdownItemText}
        activeColor="#f8fafc"
        data={dropdownOptions}
        search={searchable}
        maxHeight={260}
        labelField="name"
        valueField="id"
        searchField="name"
        placeholder={`Select ${taxonomyName.toLowerCase()}`}
        searchPlaceholder={`Type ${taxonomyName.toLowerCase()}`}
        searchPlaceholderTextColor="#94a3b8"
        value={selectedId || null}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={(item) => {
          onSelect?.(String(item?.id || ''));
          setIsFocused(false);
        }}
        flatListProps={{
          nestedScrollEnabled: true,
          keyboardShouldPersistTaps: 'handled',
        }}
        renderItem={(item, selected) => (
          <View
            style={[
              styles.taxonomyDropdownItem,
              selected && styles.taxonomyDropdownItemSelected,
            ]}
          >
            <Text style={[styles.taxonomyDropdownItemText, selected && styles.taxonomyDropdownItemTextSelected]}>
              {item?.name || ''}
            </Text>
          </View>
        )}
        renderRightIcon={() => (
          <Text style={styles.taxonomyDropdownIcon}>{isFocused ? 'Hide' : 'Select'}</Text>
        )}
        showsVerticalScrollIndicator
        keyboardAvoiding={false}
      />
    </View>
  );
};
