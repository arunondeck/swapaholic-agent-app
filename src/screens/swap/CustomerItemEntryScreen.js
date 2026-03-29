import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { createCustomerPickupItem } from '../../api/swapOpsApi';
import { ScreenShell } from '../../components/ScreenShell';
import { useLoader } from '../../context/LoaderContext';
import { useSwapStore } from '../../store/swapStore';
import { styles } from '../../styles/commonStyles';

const YES_NO_OPTIONS = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
];

export const CustomerItemEntryScreen = ({ pop, customerEmail, sourceType, sourceId }) => {
  const [itemOptions, setItemOptions] = useState({
    categoryOptions: {},
    colorOptions: [],
    conditionOptions: [],
    brandOptions: [],
    userSegmentOptions: [],
  });
  const [photoTaken, setPhotoTaken] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [photoUri, setPhotoUri] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [size, setSize] = useState('');
  const [points, setPoints] = useState('');
  const [material, setMaterial] = useState('');
  const [color, setColor] = useState('');
  const [condition, setCondition] = useState('');
  const [damage, setDamage] = useState('');
  const [reject, setReject] = useState('no');
  const [userSegmentId, setUserSegmentId] = useState('');
  const [occasionId, setOccasionId] = useState('');
  const [madeInId, setMadeInId] = useState('');
  const [diy, setDiy] = useState('no');
  const [newWithTag, setNewWithTag] = useState('no');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savedItemId, setSavedItemId] = useState('');
  const [error, setError] = useState('');
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const { withLoader } = useLoader();
  const profileEntry = useSwapStore((state) => state.currentCustomerData.profile);
  const subscriptionEntry = useSwapStore((state) => state.currentCustomerData.subscriptionDetailsById[String(sourceId)] || null);
  const pickupEntry = useSwapStore((state) => state.currentCustomerData.pickupDetailsById[String(sourceId)] || null);
  const fetchCustomerProfileIfNeeded = useSwapStore((state) => state.fetchCustomerProfileIfNeeded);
  const fetchCustomerSubscriptionDetailIfNeeded = useSwapStore((state) => state.fetchCustomerSubscriptionDetailIfNeeded);
  const fetchCustomerPickupDetailIfNeeded = useSwapStore((state) => state.fetchCustomerPickupDetailIfNeeded);
  const fetchReferenceDataIfNeeded = useSwapStore((state) => state.fetchReferenceDataIfNeeded);
  const canUseCache = useSwapStore((state) => state.isCustomerCacheUsable);
  const invalidateCustomerCache = useSwapStore((state) => state.invalidateCustomerCache);
  const customer = profileEntry.data;
  const sourceEntry = sourceType === 'subscription' ? subscriptionEntry : pickupEntry;
  const source = sourceEntry?.data || null;

  useEffect(() => {
    const loadData = async () => {
      const state = useSwapStore.getState();
      const latestProfileEntry = state.currentCustomerData.profile;
      const latestSourceEntry =
        sourceType === 'subscription'
          ? state.currentCustomerData.subscriptionDetailsById[String(sourceId)] || null
          : state.currentCustomerData.pickupDetailsById[String(sourceId)] || null;
      const profilePromise = fetchCustomerProfileIfNeeded(customerEmail);
      const sourcePromise =
        sourceType === 'subscription'
          ? fetchCustomerSubscriptionDetailIfNeeded(customerEmail, sourceId)
          : fetchCustomerPickupDetailIfNeeded(customerEmail, sourceId);
      const optionsPromise = fetchReferenceDataIfNeeded().then(() => useSwapStore.getState().getItemEntryOptions());
      const hasUsableCache = canUseCache(latestProfileEntry) && canUseCache(latestSourceEntry);

      try {
        setError('');
        const [, options] = hasUsableCache
          ? await Promise.all([profilePromise, optionsPromise, sourcePromise])
          : await withLoader(Promise.all([profilePromise, optionsPromise, sourcePromise]), 'Loading item entry...');

        const categories = Object.keys(options.categoryOptions);
        const defaultCategory = categories[0] || '';
        const defaultSubcategory = options.categoryOptions[defaultCategory]?.[0] || '';

        setItemOptions(options);
        setCategory(defaultCategory);
        setSubcategory(defaultSubcategory);
        setColor(options.colorOptions[0] || '');
        setCondition(options.conditionOptions[0] || '');
        setMaterial(options.materialOptions?.[0]?.name || '');
        setOccasionId(options.occasionOptions?.[0]?.id || '');
        setMadeInId(options.madeInOptions?.[0]?.id || '');
        setUserSegmentId(options.userSegmentOptions?.[0]?.id || '');
      } catch (loadError) {
        setError(loadError.message || 'Failed to load item entry data');
      }
    };

    loadData();
  }, [
    canUseCache,
    customerEmail,
    fetchCustomerPickupDetailIfNeeded,
    fetchCustomerProfileIfNeeded,
    fetchReferenceDataIfNeeded,
    fetchCustomerSubscriptionDetailIfNeeded,
    sourceId,
    sourceType,
    withLoader,
  ]);

  const categories = useMemo(() => Object.keys(itemOptions.categoryOptions), [itemOptions.categoryOptions]);
  const subcategoryOptions = useMemo(() => itemOptions.categoryOptions[category] || [], [category, itemOptions.categoryOptions]);
  const selectedBrand = useMemo(
    () => itemOptions.brandOptions.find((option) => String(option?.name || '').trim().toLowerCase() === brand.trim().toLowerCase()) || null,
    [brand, itemOptions.brandOptions]
  );
  const selectedStyle = useMemo(
    () => itemOptions.styleOptions?.find((option) => String(option?.name || '').trim().toLowerCase() === subcategory.trim().toLowerCase()) || null,
    [itemOptions.styleOptions, subcategory]
  );
  const selectedColor = useMemo(
    () => itemOptions.colorEntities?.find((option) => String(option?.name || '').trim().toLowerCase() === color.trim().toLowerCase()) || null,
    [color, itemOptions.colorEntities]
  );
  const selectedMaterial = useMemo(
    () => itemOptions.materialOptions?.find((option) => String(option?.name || '').trim().toLowerCase() === material.trim().toLowerCase()) || null,
    [itemOptions.materialOptions, material]
  );
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

  const openCamera = async () => {
    const currentPermission = permission?.granted ? permission : await requestPermission();
    if (!currentPermission?.granted) {
      Alert.alert('Camera Permission', 'Camera access is required to attach an item photo.');
      return;
    }

    setCameraOpen(true);
  };

  const capturePhoto = async () => {
    try {
      const result = await cameraRef.current?.takePictureAsync?.({
        quality: 0.7,
      });

      if (!result?.uri) {
        throw new Error('Unable to capture photo.');
      }

      const nextThumbnailFile = {
        uri: result.uri,
        name: `pickup-item-${Date.now()}.jpg`,
        type: 'image/jpeg',
      };

      setThumbnailFile(nextThumbnailFile);
      setPhotoUri(result.uri);
      setPhotoTaken(true);
      setCameraOpen(false);
    } catch (captureError) {
      Alert.alert('Camera Error', captureError.message || 'Unable to capture photo.');
    }
  };

  const submitItem = async () => {
    if (!source?.id || sourceType !== 'pickup') {
      setError('Adding a new item currently requires a pickup source.');
      return;
    }

    if (!thumbnailFile) {
      setError('Capture an item photo before submitting.');
      return;
    }

    const payload = {
      sub_status_c: 'out_inventory',
      brand_label_c: selectedBrand?.id || brand.trim(),
      brand_segment_id_c: userSegmentId || selectedBrand?.brand_segments?.id || '',
      occasion_id_c: occasionId.trim(),
      style_id_c: selectedStyle?.id || '',
      color_id_c: selectedColor?.id || '',
      material_id_c: selectedMaterial?.id || '',
      made_in_id_c: madeInId || '',
      diy,
      new_with_tag_c: newWithTag,
      rejected_reason_c: reject === 'yes' ? 'manual_reject' : '',
    };

    try {
      setSubmitting(true);
      setError('');

      const result = await withLoader(
        createCustomerPickupItem({
          pickupId: source.id,
          thumbnailFile,
          item: payload,
        }),
        'Saving item...'
      );

      setSavedItemId(result.itemId || '');
      setSubmitted(true);
      invalidateCustomerCache(['pickups', 'pickupDetailsById', 'swappedInItems']);
      await fetchCustomerPickupDetailIfNeeded(customerEmail, source.id, { force: true });
    } catch (submitError) {
      setError(submitError.message || 'Failed to save item.');
    } finally {
      setSubmitting(false);
    }
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
        <TouchableOpacity onPress={openCamera} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>{photoTaken ? 'Retake Picture' : 'Take Picture'}</Text>
        </TouchableOpacity>

        {photoUri ? <Image source={{ uri: photoUri }} style={styles.itemImage} resizeMode="cover" /> : null}

        {cameraOpen ? (
          <View style={styles.scannerCard}>
            <Text style={styles.cardTitle}>Capture Item Photo</Text>
            <Text style={styles.helperText}>Take a clear thumbnail image for the pickup item.</Text>
            <View style={styles.cameraFrame}>
              <CameraView ref={cameraRef} style={styles.cameraPreview} facing="back" />
            </View>
            <View style={styles.row}>
              <TouchableOpacity onPress={() => setCameraOpen(false)} style={[styles.secondaryButton, { flex: 1 }]}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={capturePhoto} style={[styles.primaryButton, { flex: 1 }]}>
                <Text style={styles.primaryButtonText}>Capture</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

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

        {itemOptions.materialOptions?.length ? (
          <>
            <Text style={styles.selectLabel}>Material</Text>
            <View style={styles.chipRow}>
              {itemOptions.materialOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => setMaterial(option.name)}
                  style={[styles.chip, material === option.name && styles.chipActive]}
                >
                  <Text style={styles.chipText}>{option.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : null}

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

        <Text style={styles.selectLabel}>Rejected?</Text>
        <View style={styles.chipRow}>
          {YES_NO_OPTIONS.map((option) => (
            <TouchableOpacity
              key={`reject-${option.value}`}
              onPress={() => setReject(option.value)}
              style={[styles.chip, reject === option.value && styles.chipActive]}
            >
              <Text style={styles.chipText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.selectLabel}>User Segment</Text>
        <View style={styles.chipRow}>
          {itemOptions.userSegmentOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              onPress={() => setUserSegmentId(option.id)}
              style={[styles.chip, userSegmentId === option.id && styles.chipActive]}
            >
              <Text style={styles.chipText}>{option.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          placeholder="Occasion ID"
          placeholderTextColor="#8b8b8b"
          style={styles.input}
          value={occasionId}
          onChangeText={setOccasionId}
        />

        {itemOptions.occasionOptions?.length ? (
          <>
            <Text style={styles.selectLabel}>Occasion</Text>
            <View style={styles.chipRow}>
              {itemOptions.occasionOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => setOccasionId(option.id)}
                  style={[styles.chip, occasionId === option.id && styles.chipActive]}
                >
                  <Text style={styles.chipText}>{option.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : null}

        {itemOptions.madeInOptions?.length ? (
          <>
            <Text style={styles.selectLabel}>Made In</Text>
            <View style={styles.chipRow}>
              {itemOptions.madeInOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => setMadeInId(option.id)}
                  style={[styles.chip, madeInId === option.id && styles.chipActive]}
                >
                  <Text style={styles.chipText}>{option.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : null}

        <Text style={styles.selectLabel}>DIY?</Text>
        <View style={styles.chipRow}>
          {YES_NO_OPTIONS.map((option) => (
            <TouchableOpacity
              key={`diy-${option.value}`}
              onPress={() => setDiy(option.value)}
              style={[styles.chip, diy === option.value && styles.chipActive]}
            >
              <Text style={styles.chipText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.selectLabel}>New With Tag</Text>
        <View style={styles.chipRow}>
          {YES_NO_OPTIONS.map((option) => (
            <TouchableOpacity
              key={`new-with-tag-${option.value}`}
              onPress={() => setNewWithTag(option.value)}
              style={[styles.chip, newWithTag === option.value && styles.chipActive]}
            >
              <Text style={styles.chipText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          disabled={!canSubmit || submitting}
          onPress={submitItem}
          style={[styles.primaryButton, (!canSubmit || submitting) && styles.primaryButtonDisabled]}
        >
          <Text style={styles.primaryButtonText}>{submitting ? 'Saving...' : 'Enter'}</Text>
        </TouchableOpacity>
      </View>

      {submitted ? (
        <View style={styles.listItem}>
          <Text style={styles.sectionTitle}>Entered Item</Text>
          <Text style={styles.itemMeta}>Item ID: {savedItemId || 'NA'}</Text>
          <Text style={styles.itemMeta}>{brand} | {category} | {subcategory}</Text>
          <Text style={styles.itemMeta}>Size: {size} | Points: {points}</Text>
          <Text style={styles.itemMeta}>Material: {material} | Color: {color}</Text>
          <Text style={styles.itemMeta}>Condition: {condition} | Damage: {damage || 'None'}</Text>
          <Text style={styles.itemMeta}>Rejected: {reject} | DIY: {diy} | New With Tag: {newWithTag}</Text>
        </View>
      ) : null}
    </ScreenShell>
  );
};
