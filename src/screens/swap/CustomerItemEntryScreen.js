import React, { useMemo, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ScreenShell } from '../../components/ScreenShell';
import {
  categoryOptions,
  colorOptions,
  conditionOptions,
  getCustomerPickup,
  getCustomerProfile,
  getCustomerSubscription,
} from '../../data/mockData';
import { styles } from '../../styles/commonStyles';

const categories = Object.keys(categoryOptions);

export const CustomerItemEntryScreen = ({ pop, customerEmail, sourceType, sourceId }) => {
  const customer = getCustomerProfile(customerEmail);
  const source =
    sourceType === 'subscription'
      ? getCustomerSubscription(customerEmail, sourceId)
      : getCustomerPickup(customerEmail, sourceId);

  const [photoTaken, setPhotoTaken] = useState(false);
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [subcategory, setSubcategory] = useState(categoryOptions[categories[0]][0]);
  const [size, setSize] = useState('');
  const [points, setPoints] = useState('');
  const [material, setMaterial] = useState('');
  const [color, setColor] = useState(colorOptions[0]);
  const [condition, setCondition] = useState(conditionOptions[0]);
  const [damage, setDamage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const subcategoryOptions = useMemo(() => categoryOptions[category] || [], [category]);
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
    setSubcategory(categoryOptions[nextCategory][0]);
  };

  return (
    <ScreenShell
      title="Add Item"
      subtitle={`${customer.name} • ${sourceType === 'subscription' ? source.plan : source.id}`}
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
          {colorOptions.map((option) => (
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
          {conditionOptions.map((option) => (
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
          <Text style={styles.itemMeta}>{brand} • {category} • {subcategory}</Text>
          <Text style={styles.itemMeta}>Size: {size} • Points: {points}</Text>
          <Text style={styles.itemMeta}>Material: {material} • Color: {color}</Text>
          <Text style={styles.itemMeta}>Condition: {condition} • Damage: {damage || 'None'}</Text>
        </View>
      ) : null}
    </ScreenShell>
  );
};
