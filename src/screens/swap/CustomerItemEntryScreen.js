import React, { useEffect, useMemo, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import {
  getCustomerPickupDetails,
  getCustomerProfile,
  getCustomerSubscriptionDetails,
  getItemEntryOptions,
} from '../../api/swapOpsApi';
import { ScreenShell } from '../../components/ScreenShell';
import { useLoader } from '../../context/LoaderContext';
import { styles } from '../../styles/commonStyles';

export const CustomerItemEntryScreen = ({ pop, customerEmail, sourceType, sourceId }) => {
  const [customer, setCustomer] = useState(null);
  const [source, setSource] = useState(null);
  const [itemOptions, setItemOptions] = useState({
    categoryOptions: {},
    colorOptions: [],
    conditionOptions: [],
  });
  const [photoTaken, setPhotoTaken] = useState(false);
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [size, setSize] = useState('');
  const [points, setPoints] = useState('');
  const [material, setMaterial] = useState('');
  const [color, setColor] = useState('');
  const [condition, setCondition] = useState('');
  const [damage, setDamage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const { withLoader } = useLoader();

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        setError('');
        const [profile, options, currentSource] = await withLoader(
          Promise.all([
            getCustomerProfile(customerEmail),
            getItemEntryOptions(),
            sourceType === 'subscription'
              ? getCustomerSubscriptionDetails(customerEmail, sourceId)
              : getCustomerPickupDetails(customerEmail, sourceId),
          ]),
          'Loading item entry...'
        );

        if (!active) {
          return;
        }

        const categories = Object.keys(options.categoryOptions);
        const defaultCategory = categories[0] || '';
        const defaultSubcategory = options.categoryOptions[defaultCategory]?.[0] || '';

        setCustomer(profile);
        setItemOptions(options);
        setSource(currentSource);
        setCategory(defaultCategory);
        setSubcategory(defaultSubcategory);
        setColor(options.colorOptions[0] || '');
        setCondition(options.conditionOptions[0] || '');
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Failed to load item entry data');
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [customerEmail, sourceId, sourceType, withLoader]);

  const categories = useMemo(() => Object.keys(itemOptions.categoryOptions), [itemOptions.categoryOptions]);
  const subcategoryOptions = useMemo(() => itemOptions.categoryOptions[category] || [], [category, itemOptions.categoryOptions]);
  const canSubmit =
    photoTaken &&
    brand.trim().length > 0 &&
    category.trim().length > 0 &&
    subcategory.trim().length > 0 &&
    size.trim().length > 0 &&
    points.trim().length > 0 &&
    material.trim().length > 0 &&
    color.trim().length > 0 &&
    condition.trim().length > 0;

  const onCategoryChange = (nextCategory) => {
    setCategory(nextCategory);
    setSubcategory(itemOptions.categoryOptions[nextCategory]?.[0] || '');
  };

  if (!customer || !source) {
    return (
      <ScreenShell title="Add Item" subtitle={error || 'Loading item entry form...'} onBack={pop} backgroundColor="#ffe4e1">
        <Text>{error || 'Loading...'}</Text>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      title="Add Item"
      subtitle={`${customer.name} | ${sourceType === 'subscription' ? source.plan : source.id}`}
      onBack={pop}
      backgroundColor="#ffe4e1"
    >
      <View style={styles.formCard}>
        <TouchableOpacity onPress={() => setPhotoTaken(true)} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>{photoTaken ? 'Picture Captured' : 'Take Picture'}</Text>
        </TouchableOpacity>

        <TextInput placeholder="Brand" placeholderTextColor="#8b8b8b" style={styles.input} value={brand} onChangeText={setBrand} />

        <Text style={styles.selectLabel}>Category</Text>
        <View style={styles.chipRow}>
          {categories.map((option) => (
            <TouchableOpacity
              key={option}
              onPress={() => onCategoryChange(option)}
              style={[styles.chip, category === option && styles.chipActive]}
            >
              <Text style={styles.chipText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.selectLabel}>Subcategory</Text>
        <View style={styles.chipRow}>
          {subcategoryOptions.map((option) => (
            <TouchableOpacity
              key={option}
              onPress={() => setSubcategory(option)}
              style={[styles.chip, subcategory === option && styles.chipActive]}
            >
              <Text style={styles.chipText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput placeholder="Size" placeholderTextColor="#8b8b8b" style={styles.input} value={size} onChangeText={setSize} />
        <TextInput
          keyboardType="numeric"
          placeholder="Points"
          placeholderTextColor="#8b8b8b"
          style={styles.input}
          value={points}
          onChangeText={setPoints}
        />
        <TextInput
          placeholder="Material"
          placeholderTextColor="#8b8b8b"
          style={styles.input}
          value={material}
          onChangeText={setMaterial}
        />

        <Text style={styles.selectLabel}>Color</Text>
        <View style={styles.chipRow}>
          {itemOptions.colorOptions.map((option) => (
            <TouchableOpacity
              key={option}
              onPress={() => setColor(option)}
              style={[styles.chip, color === option && styles.chipActive]}
            >
              <Text style={styles.chipText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.selectLabel}>Condition</Text>
        <View style={styles.chipRow}>
          {itemOptions.conditionOptions.map((option) => (
            <TouchableOpacity
              key={option}
              onPress={() => setCondition(option)}
              style={[styles.chip, condition === option && styles.chipActive]}
            >
              <Text style={styles.chipText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          placeholder="Damage"
          placeholderTextColor="#8b8b8b"
          style={styles.input}
          value={damage}
          onChangeText={setDamage}
        />

        <TouchableOpacity
          disabled={!canSubmit}
          onPress={() => setSubmitted(true)}
          style={[styles.primaryButton, !canSubmit && styles.primaryButtonDisabled]}
        >
          <Text style={styles.primaryButtonText}>Enter</Text>
        </TouchableOpacity>
      </View>

      {submitted ? (
        <View style={styles.listItem}>
          <Text style={styles.sectionTitle}>Entered Item</Text>
          <Text style={styles.itemMeta}>{brand} | {category} | {subcategory}</Text>
          <Text style={styles.itemMeta}>Size: {size} | Points: {points}</Text>
          <Text style={styles.itemMeta}>Material: {material} | Color: {color}</Text>
          <Text style={styles.itemMeta}>Condition: {condition} | Damage: {damage || 'None'}</Text>
        </View>
      ) : null}
    </ScreenShell>
  );
};
