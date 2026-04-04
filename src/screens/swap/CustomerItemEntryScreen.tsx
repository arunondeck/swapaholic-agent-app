// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { createCustomerPickupItem, getLatestPickupForSubscription } from '../../api/swapOpsApi';
import { ScreenShell } from '../../components/ScreenShell';
import { TaxonomySelect } from '../../components/TaxonomySelect';
import { filterSizesByTaxonomy } from '../../services/sizeFilterService';
import { filterStylesByCategory } from '../../services/styleFilterService';
import { useLoader } from '../../utils/LoaderContextShared';
import { useSwapStore } from '../../store/swapStore';
import { styles } from '../../styles/commonStyles';

/**
 * @param {unknown} error
 * @param {string} fallbackMessage
 * @returns {string}
 */
const getErrorMessage = (error, fallbackMessage) => (error instanceof Error ? error.message : fallbackMessage);

/**
 * @template T
 * @param {{
 *   options?: T[],
 *   selectedValue?: string,
 *   onSelect: (option: T) => void,
 *   getKey: (option: T) => string,
 *   getLabel: (option: T) => string
 * }} props
 */
const renderChipOptions = ({ options = [], selectedValue = '', onSelect, getKey, getLabel }) => (
  <View style={styles.chipRow}>
    {options.map((option) => {
      const key = getKey(option);
      const label = getLabel(option);
      const isSelected = selectedValue === key;

      return (
        <TouchableOpacity key={key} onPress={() => onSelect(option)} style={[styles.chip, isSelected && styles.chipActive]}>
          <Text style={styles.chipText}>{label}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

/** @type {import('../../types/swapTypes').SwapItemEntryOptions} */
const INITIAL_ITEM_OPTIONS = {
  categoryOptions: {},
  conditionOptions: [],
  brandOptions: [],
  userSegmentOptions: [],
  colorOptions: [],
  styleOptions: [],
  sizeOptions: [],
  materialOptions: [],
  madeInOptions: [],
  occasionOptions: [],
  categoryEntities: [],
};

/**
 * @param {{
 *   pop: () => void,
 *   customerEmail: string,
 *   sourceType: 'subscription' | 'pickup',
 *   sourceId: string
 * }} props
 */
export const CustomerItemEntryScreen = ({ pop, customerEmail, sourceType, sourceId }) => {
  /** @type {[import('../../types/swapTypes').SwapItemEntryOptions, React.Dispatch<React.SetStateAction<import('../../types/swapTypes').SwapItemEntryOptions>>]} */
  const [itemOptions, setItemOptions] = useState(INITIAL_ITEM_OPTIONS);
  const [photoTaken, setPhotoTaken] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [photoUri, setPhotoUri] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState(/** @type {import('../../types/swapTypes').SwapAddItemRequest['thumbnailFile'] | null} */ (null));
  const [brand, setBrand] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [category, setCategory] = useState('');
  const [sizeId, setSizeId] = useState('');
  const [size, setSize] = useState('');
  const [materialId, setMaterialId] = useState('');
  const [material, setMaterial] = useState('');
  const [colorId, setColorId] = useState('');
  const [styleId, setStyleId] = useState('');
  const [condition, setCondition] = useState('');
  const [damage, setDamage] = useState('');
  const [userSegmentId, setUserSegmentId] = useState('');
  const [occasionId, setOccasionId] = useState('');
  const [madeInId, setMadeInId] = useState('');
  const [diy, setDiy] = useState(false);
  const [newWithTag, setNewWithTag] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savedItemId, setSavedItemId] = useState('');
  const [error, setError] = useState('');
  const [isMoreInfoOpen, setIsMoreInfoOpen] = useState(false);
  /** @type {[import('../../types/swapTypes').SwapPickup | null, React.Dispatch<React.SetStateAction<import('../../types/swapTypes').SwapPickup | null>>]} */
  const [resolvedPickupSource, setResolvedPickupSource] = useState(null);
  /** @type {[{ categories: number, userSegments: number }, React.Dispatch<React.SetStateAction<{ categories: number, userSegments: number }>>]} */
  const [debugCounts, setDebugCounts] = useState({
    categories: 0,
    userSegments: 0,
  });
  /** @type {React.MutableRefObject<import('expo-camera').CameraViewRef | null>} */
  const cameraRef = useRef(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = ImagePicker.useMediaLibraryPermissions();
  /** @type {{ withLoader: <T>(task: Promise<T>, nextMessage?: string) => Promise<T> }} */
  const { withLoader } = useLoader();
  const profileEntry = useSwapStore((state) => state.currentCustomerData.profile);
  const fetchCustomerProfileIfNeeded = useSwapStore((state) => state.fetchCustomerProfileIfNeeded);
  const fetchCustomerSubscriptionDetailIfNeeded = useSwapStore((state) => state.fetchCustomerSubscriptionDetailIfNeeded);
  const fetchCustomerPickupDetailIfNeeded = useSwapStore((state) => state.fetchCustomerPickupDetailIfNeeded);
  const fetchReferenceDataIfNeeded = useSwapStore((state) => state.fetchReferenceDataIfNeeded);
  const canUseCache = useSwapStore((state) => state.isCustomerCacheUsable);
  const invalidateCustomerCache = useSwapStore((state) => state.invalidateCustomerCache);
  const requestPickupDetailRefresh = useSwapStore((state) => state.requestPickupDetailRefresh);
  const customer = profileEntry.data;
  /** @type {import('../../types/swapTypes').SwapPickup | null} */
  const pickupSource = resolvedPickupSource;

  useEffect(() => {
    const loadData = async () => {
      const state = useSwapStore.getState();
      const latestProfileEntry = state.currentCustomerData.profile;
      const latestSourceEntry =
        sourceType === 'subscription'
          ? state.currentCustomerData.subscriptionDetailsById[String(sourceId)] || null
          : state.currentCustomerData.pickupDetailsById[String(sourceId)] || null;
      const profilePromise = fetchCustomerProfileIfNeeded(customerEmail);
      const optionsPromise = fetchReferenceDataIfNeeded().then(() => useSwapStore.getState().getItemEntryOptions());
      const hasUsableCache = canUseCache(latestProfileEntry) && canUseCache(latestSourceEntry);

      try {
        setError('');
        setResolvedPickupSource(null);
        /** @type {import('../../types/swapTypes').SwapItemEntryOptions} */
        let options = INITIAL_ITEM_OPTIONS;
        /** @type {import('../../types/swapTypes').SwapPickup | null} */
        let nextPickupSource = null;

        if (sourceType === 'subscription') {
          const subscriptionPromise = fetchCustomerSubscriptionDetailIfNeeded(customerEmail, sourceId);
          if (hasUsableCache) {
            await Promise.all([profilePromise, subscriptionPromise]);
          } else {
            await withLoader(Promise.all([profilePromise, subscriptionPromise]), 'Loading item entry...');
          }
          options = await optionsPromise;
          nextPickupSource = await withLoader(
            getLatestPickupForSubscription(customerEmail, sourceId),
            'Loading latest pickup...'
          );
          if (!nextPickupSource?.id) {
            throw new Error('No pickup found for this subscription. Create a pickup before adding items.');
          }
        } else {
          const pickupPromise = fetchCustomerPickupDetailIfNeeded(customerEmail, sourceId);
          if (hasUsableCache) {
            const [, resolvedPickup] = await Promise.all([profilePromise, pickupPromise]);
            nextPickupSource = resolvedPickup || null;
          } else {
            const [, resolvedPickup] = await withLoader(Promise.all([profilePromise, pickupPromise]), 'Loading item entry...');
            nextPickupSource = resolvedPickup || null;
          }
          options = await optionsPromise;
        }

        const nextDebugCounts = {
          categories: Array.isArray(options.categoryEntities) ? options.categoryEntities.length : 0,
          userSegments: Array.isArray(options.userSegmentOptions) ? options.userSegmentOptions.length : 0,
        };

        setItemOptions(options);
        setResolvedPickupSource(nextPickupSource);
        setDebugCounts(nextDebugCounts);
        setCategoryId('');
        setCategory('');
        setSizeId('');
        setSize('');
        setCondition(options.conditionOptions[0] || '');
        setMaterialId('');
        setMaterial('');
        setColorId('');
        setStyleId('');
        setOccasionId('');
        setMadeInId('');
        setUserSegmentId('');
        console.log('[CustomerItemEntryScreen] option counts', nextDebugCounts);
      } catch (loadError) {
        const errorMessage = getErrorMessage(loadError, 'Failed to load item entry data');
        console.log('[CustomerItemEntryScreen] loadData failed', {
          message: errorMessage,
          sourceType,
          sourceId,
        });
        setResolvedPickupSource(null);
        setError(errorMessage);
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

  const categories = useMemo(() => itemOptions.categoryEntities || [], [itemOptions.categoryEntities]);
  const selectedBrand = useMemo(
    () => itemOptions.brandOptions.find((option) => String(option?.name || '').trim().toLowerCase() === brand.trim().toLowerCase()) || null,
    [brand, itemOptions.brandOptions]
  );
  const selectedMaterial = useMemo(
    () => itemOptions.materialOptions?.find((option) => option.id === materialId) || null,
    [materialId, itemOptions.materialOptions]
  );
  const defaultColorOption = useMemo(
    () =>
      itemOptions.colorOptions?.find((option) => String(option?.name || '').trim().toLowerCase() === 'multi') || null,
    [itemOptions.colorOptions]
  );
  const selectedColor = useMemo(
    () => itemOptions.colorOptions?.find((option) => option.id === colorId) || null,
    [colorId, itemOptions.colorOptions]
  );
  const selectedStyle = useMemo(
    () => itemOptions.styleOptions?.find((option) => option.id === styleId) || null,
    [itemOptions.styleOptions, styleId]
  );
  const selectedSize = useMemo(
    () => itemOptions.sizeOptions?.find((option) => option.id === sizeId) || null,
    [itemOptions.sizeOptions, sizeId]
  );
  const selectedOccasion = useMemo(
    () => itemOptions.occasionOptions?.find((option) => option.id === occasionId) || null,
    [itemOptions.occasionOptions, occasionId]
  );
  const selectedUserSegment = useMemo(
    () => itemOptions.userSegmentOptions?.find((option) => option.id === userSegmentId) || null,
    [itemOptions.userSegmentOptions, userSegmentId]
  );
  const filteredStyleOptions = useMemo(
    () =>
      filterStylesByCategory({
        styles: itemOptions.styleOptions || [],
        categoryId,
      }),
    [categoryId, itemOptions.styleOptions]
  );
  const filteredSizeOptions = useMemo(
    () =>
      filterSizesByTaxonomy({
        sizes: itemOptions.sizeOptions || [],
        categoryName: category,
        userSegmentName: selectedUserSegment?.name || '',
      }),
    [category, itemOptions.sizeOptions, selectedUserSegment?.name]
  );
  const canSubmit =
    photoTaken &&
    brand.trim().length > 0 &&
    categoryId.trim().length > 0 &&
    sizeId.trim().length > 0 &&
    occasionId.trim().length > 0 &&
    userSegmentId.trim().length > 0;

  /**
   * @param {string} nextCategory
   */
  const onCategoryChange = (nextCategory) => {
    const nextCategoryOption = categories.find((option) => option.id === nextCategory) || null;
    const nextCategoryName = nextCategoryOption?.name || '';
    setCategoryId(nextCategoryOption?.id || '');
    setCategory(nextCategoryName);
    setStyleId('');
    setSizeId('');
    setSize('');
  };

  /**
   * @param {string} nextUserSegmentId
   */
  const onUserSegmentChange = (nextUserSegmentId) => {
    setUserSegmentId(nextUserSegmentId);
    setSizeId('');
    setSize('');
  };

  /**
   * @param {string} nextSizeId
   */
  const onSizeChange = (nextSizeId) => {
    const nextSize = filteredSizeOptions.find((option) => option.id === nextSizeId) || null;
    setSizeId(nextSizeId);
    setSize(nextSize?.name || '');
  };

  /**
   * @param {string} nextMaterialId
   */
  const onMaterialChange = (nextMaterialId) => {
    const nextMaterial = itemOptions.materialOptions?.find((option) => option.id === nextMaterialId) || null;
    setMaterialId(nextMaterialId);
    setMaterial(nextMaterial?.name || '');
  };

  /**
   * @param {string} uri
   */
  const updateSelectedPhoto = (uri) => {
    const nextThumbnailFile = {
      uri,
      name: `pickup-item-${Date.now()}.jpg`,
      type: 'image/jpeg',
    };

    setThumbnailFile(nextThumbnailFile);
    setPhotoUri(uri);
    setPhotoTaken(true);
    setCameraOpen(false);
  };

  const ensureCameraPermission = async () => {
    const currentPermission = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();
    if (!currentPermission?.granted) {
      Alert.alert('Camera Permission', 'Camera access is required to take a product picture.');
      return false;
    }

    return true;
  };

  const ensureMediaPermission = async () => {
    const currentPermission = mediaPermission?.granted ? mediaPermission : await requestMediaPermission();
    if (!currentPermission?.granted) {
      Alert.alert('Photos Permission', 'Photo library access is required to select an existing product picture.');
      return false;
    }

    return true;
  };

  const openCamera = async () => {
    const hasPermission = await ensureCameraPermission();
    if (!hasPermission) {
      return;
    }

    setCameraOpen(true);
  };

  const selectPicture = async () => {
    const hasPermission = await ensureMediaPermission();
    if (!hasPermission) {
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (result.canceled) {
        return;
      }

      const selectedAsset = result.assets?.[0];
      if (!selectedAsset?.uri) {
        throw new Error('Unable to select photo.');
      }

      updateSelectedPhoto(selectedAsset.uri);
    } catch (selectionError) {
      Alert.alert('Photo Selection Error', getErrorMessage(selectionError, 'Unable to select photo.'));
    }
  };

  const capturePhoto = async () => {
    try {
      const result = await cameraRef.current?.takePicture?.({
        quality: 0.7,
      });

      if (!result?.uri) {
        throw new Error('Unable to capture photo.');
      }

      updateSelectedPhoto(result.uri);
    } catch (captureError) {
      Alert.alert('Camera Error', getErrorMessage(captureError, 'Unable to capture photo.'));
    }
  };

  const submitItem = async () => {
    if (!pickupSource?.unique_id_c) {
      setError('Adding a new item currently requires a pickup source.');
      return;
    }

    if (!thumbnailFile) {
      setError('Attach an item photo before submitting.');
      return;
    }

    /** @type {Record<string, unknown>} */
    const payload = {};

    if (selectedBrand?.id) {
      payload.brand_id_c = selectedBrand.id;
    }
    if (selectedBrand?.brand_segments?.id) {
      payload.brand_segment_id_c = selectedBrand.brand_segments.id;
    }
    if (userSegmentId) {
      payload.user_segment_id_c = userSegmentId;
    }
    if (categoryId) {
      payload.category_id_c = categoryId;
    }
    if (sizeId) {
      payload.size_id_c = sizeId;
    }
    if (occasionId.trim()) {
      payload.occasion_id_c = occasionId.trim();
    }
    if (selectedMaterial?.id) {
      payload.material_id_c = selectedMaterial.id;
    }
    if (selectedColor?.id) {
      payload.color_id_c = selectedColor.id;
    }
    if (!payload.color_id_c && defaultColorOption?.id) {
      payload.color_id_c = defaultColorOption.id;
    }
    if (selectedStyle?.id) {
      payload.style_id_c = selectedStyle.id;
    }
    if (madeInId) {
      payload.made_in_id_c = madeInId;
    }
    payload.sub_status_c = 'published';
    payload.available_c = 'yes';

    try {
      setSubmitting(true);
      setError('');

      const result = await withLoader(
        createCustomerPickupItem({
          pickupId: pickupSource.unique_id_c,
          thumbnailFile,
          item: payload,
        }),
        'Saving item...'
      );

      setSavedItemId(result.itemId || '');
      if (sourceType === 'pickup') {
        requestPickupDetailRefresh(pickupSource.id, 'itemAdded');
        pop();
        return;
      }

      setSubmitted(true);
      invalidateCustomerCache(['pickups', 'pickupDetailsById', 'swappedInItems']);
      await fetchCustomerPickupDetailIfNeeded(customerEmail, pickupSource.id, { force: true });
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'Failed to save item.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!customer || !pickupSource) {
    return (
      <ScreenShell title="Add Item" subtitle={error || 'Loading item entry form...'} onBack={pop} backgroundColor="#ffe4e1">
        <Text>{error || 'Loading...'}</Text>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      title="Add Item"
      subtitle={`${customer.name} | ${pickupSource.unique_id_c || pickupSource.id}`}
      onBack={pop}
      backgroundColor="#ffe4e1"
    >
      <View style={styles.formCard}>
        <View style={styles.buttonGroupRow}>
          <TouchableOpacity onPress={openCamera} style={[styles.secondaryButton, styles.buttonGroupItem]}>
            <Text style={styles.secondaryButtonText}>{photoTaken ? 'Retake Picture' : 'Take Picture'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={selectPicture} style={[styles.secondaryButton, styles.buttonGroupItem]}>
            <Text style={styles.secondaryButtonText}>Select Picture</Text>
          </TouchableOpacity>
        </View>

        {photoUri ? <Image source={{ uri: photoUri }} style={styles.imagePreview} resizeMode="cover" /> : null}

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

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Product Attributes</Text>

          <TaxonomySelect
            taxonomyName="Category"
            options={categories}
            selectedId={categoryId}
            onSelect={onCategoryChange}
          />

          <TaxonomySelect
            taxonomyName="User Segment"
            options={itemOptions.userSegmentOptions}
            selectedId={userSegmentId}
            onSelect={onUserSegmentChange}
          />

          <TaxonomySelect
            taxonomyName="Brand"
            options={itemOptions.brandOptions}
            selectedId={selectedBrand?.id || ''}
            searchable
            onSelect={(nextBrandId) => {
              const nextBrand = itemOptions.brandOptions.find((option) => option.id === nextBrandId) || null;
              setBrand(nextBrand?.name || '');
            }}
          />

          <TaxonomySelect
            taxonomyName="Style"
            options={filteredStyleOptions}
            selectedId={styleId}
            searchable
            onSelect={setStyleId}
          />

          <TaxonomySelect
            taxonomyName="Occasion"
            options={itemOptions.occasionOptions || []}
            selectedId={occasionId}
            onSelect={setOccasionId}
          />

          <TaxonomySelect
            taxonomyName="Size"
            options={filteredSizeOptions}
            selectedId={sizeId}
            onSelect={onSizeChange}
          />
        </View>

        <View style={styles.collapsibleSection}>
          <TouchableOpacity onPress={() => setIsMoreInfoOpen((current) => !current)} style={styles.collapsibleHeader}>
            <Text style={styles.collapsibleTitle}>More Info</Text>
            <Text style={styles.collapsibleToggle}>{isMoreInfoOpen ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
          {isMoreInfoOpen ? (
            <View style={styles.collapsibleBody}>
              <TaxonomySelect
                taxonomyName="Material"
                options={itemOptions.materialOptions || []}
                selectedId={materialId}
                onSelect={onMaterialChange}
              />

              <TaxonomySelect
                taxonomyName="Made In"
                options={itemOptions.madeInOptions || []}
                selectedId={madeInId}
                onSelect={setMadeInId}
              />

              <TaxonomySelect
                taxonomyName="Color"
                options={itemOptions.colorOptions || []}
                selectedId={colorId}
                searchable
                onSelect={setColorId}
              />

              <Text style={styles.selectLabel}>Condition</Text>
              {renderChipOptions({
                options: itemOptions.conditionOptions,
                selectedValue: condition,
                onSelect: setCondition,
                getKey: (option) => option,
                getLabel: (option) => option,
              })}

              <TextInput
                placeholder="Damage"
                placeholderTextColor="#8b8b8b"
                style={styles.input}
                value={damage}
                onChangeText={setDamage}
              />

              <View style={styles.row}>
                <Text style={styles.selectLabel}>DIY</Text>
                <Switch value={diy} onValueChange={setDiy} />
              </View>

              <View style={styles.row}>
                <Text style={styles.selectLabel}>New With Tag</Text>
                <Switch value={newWithTag} onValueChange={setNewWithTag} />
              </View>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          disabled={!canSubmit || submitting}
          onPress={submitItem}
          style={[styles.primaryButton, (!canSubmit || submitting) && styles.primaryButtonDisabled]}
        >
          <Text style={styles.primaryButtonText}>{submitting ? 'Saving...' : 'Add Product'}</Text>
        </TouchableOpacity>
      </View>

      {submitted ? (
        <View style={styles.listItem}>
          <Text style={styles.sectionTitle}>Entered Item</Text>
          <Text style={styles.itemMeta}>Item ID: {savedItemId || 'NA'}</Text>
          <Text style={styles.itemMeta}>{selectedBrand?.name || brand} | {category}</Text>
          <Text style={styles.itemMeta}>Color: {selectedColor?.name || defaultColorOption?.name || 'NA'}</Text>
          <Text style={styles.itemMeta}>Style: {selectedStyle?.name || 'NA'}</Text>
          <Text style={styles.itemMeta}>Occasion: {selectedOccasion?.name || 'NA'} | User Segment: {selectedUserSegment?.name || 'NA'}</Text>
          <Text style={styles.itemMeta}>Size: {selectedSize?.name || size || 'NA'}</Text>
          <Text style={styles.itemMeta}>Material: {material || 'NA'}</Text>
          <Text style={styles.itemMeta}>Condition: {condition} | Damage: {damage || 'None'}</Text>
          <Text style={styles.itemMeta}>DIY: {diy ? 'Yes' : 'No'} | New With Tag: {newWithTag ? 'Yes' : 'No'}</Text>
        </View>
      ) : null}

    </ScreenShell>
  );
};
