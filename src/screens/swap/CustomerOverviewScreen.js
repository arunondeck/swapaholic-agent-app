import React, { useEffect, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import {
  getActivePackageDetails,
  getCustomerPickups,
  getCustomerProfile,
  getCustomerUnreviewedItems,
} from '../../api/swapOpsApi';
import { ScreenShell } from '../../components/ScreenShell';
import { useLoader } from '../../context/LoaderContext';
import { useSwapStore } from '../../store/swapStore';
import { styles } from '../../styles/commonStyles';

const getPendingReviewItems = (response) => response?.success?.data?.items || [];

const parseDateValue = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const CustomerOverviewScreen = ({ push, pop, customerEmail }) => {
  const activeCustomer = useSwapStore((state) => state.activeCustomer);
  const activeEmail = customerEmail || activeCustomer?.email || '';
  const [customer, setCustomer] = useState(null);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [pickups, setPickups] = useState([]);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [moreActionsOpen, setMoreActionsOpen] = useState(false);
  const [error, setError] = useState('');
  const { withLoader } = useLoader();

  useEffect(() => {
    let active = true;

    const loadCustomer = async () => {
      try {
        setError('');

        const profileRequest =
          activeCustomer?.details && activeCustomer?.email === activeEmail
            ? Promise.resolve(activeCustomer.details)
            : getCustomerProfile(activeEmail);

        const [profile, activePackageDetails, customerPickups, pendingReviewResponse] = await withLoader(
          Promise.all([
            profileRequest,
            getActivePackageDetails(activeEmail),
            getCustomerPickups(activeEmail),
            getCustomerUnreviewedItems(),
          ]),
          'Loading customer...'
        );

        if (!active) {
          return;
        }

        setCustomer(profile);
        setActiveSubscription(activePackageDetails || null);
        setPickups(customerPickups || []);
        setPendingReviewCount(getPendingReviewItems(pendingReviewResponse).length);
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Failed to load customer');
        }
      }
    };

    loadCustomer();

    return () => {
      active = false;
    };
  }, [activeCustomer?.details, activeCustomer?.email, activeEmail, withLoader]);

  const shopSubscribe = customer?.customerSubscribe?.shop_subscribe || null;
  const itemsSwappedInSummary = useMemo(() => {
    const acceptedItems = Number.parseInt(String(shopSubscribe?.number_of_accepted_items_c || 0), 10) || 0;
    const totalItems = Number.parseInt(String(shopSubscribe?.number_of_items_c || 0), 10) || 0;
    return `${acceptedItems}/${totalItems}`;
  }, [shopSubscribe]);

  if (!customer) {
    return (
      <ScreenShell title="Customer" subtitle={error || 'Loading customer details...'} onBack={pop} backgroundColor="#e7f7ef">
        {error ? <Text>{error}</Text> : null}
      </ScreenShell>
    );
  }

  const swapInTargetPickup = pickups.find((pickup) => Number.parseInt(String(pickup.remainingItems || 0), 10) > 0);
  const shopSubscribeExpiry = parseDateValue(shopSubscribe?.expiry_date_c);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isShopSubscribeExpired = shopSubscribeExpiry ? shopSubscribeExpiry < today : false;
  const hasActiveShopSubscribe = Boolean(shopSubscribe && !isShopSubscribeExpired);
  const displayedPackageName = customer.activePackage || activeSubscription?.plan || '';
  const displayedPackageSubtitle = isShopSubscribeExpired
    ? 'Package expired'
    : hasActiveShopSubscribe && activeSubscription
      ? `${activeSubscription.status} | Renews ${activeSubscription.renewalDate || 'NA'}`
      : '';
  const canAddToSubscription = hasActiveShopSubscribe && Number.parseInt(String(activeSubscription?.itemsRemaining || 0), 10) > 0;
  const canOpenActiveSubscription = hasActiveShopSubscribe && Boolean(activeSubscription);

  return (
    <ScreenShell title={customer.name} subtitle={customer.email} onBack={pop} backgroundColor="#e7f7ef">
      <View style={styles.overviewTable}>
        <View style={styles.overviewTableRow}>
          <View style={[styles.overviewTableCell, styles.overviewTableCellWithDivider]}>
            <Text style={styles.overviewTableLabel}>Total Points</Text>
            <Text style={styles.overviewTableValue}>{customer.points}</Text>
          </View>
          <View style={styles.overviewTableCell}>
            <Text style={styles.overviewTableLabel}>Points Expiry</Text>
            <Text style={styles.overviewTableValue}>{customer.pointsExpiryDate}</Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={canOpenActiveSubscription ? 0.8 : 1}
          onPress={
            canOpenActiveSubscription
              ? () =>
                  push('customerSubscriptionDetail', {
                    email: customer.email,
                    subscriptionId: activeSubscription.id,
                  })
              : undefined
          }
          style={[styles.overviewTableRow, styles.overviewTableRowBorder]}
        >
          <View style={styles.overviewTableCell}>
            <Text style={styles.overviewTableLabel}>Active Package</Text>
            <Text style={[styles.overviewTableValue, canOpenActiveSubscription ? styles.overviewTableLinkValue : null]}>
              {displayedPackageName}
            </Text>
            {displayedPackageSubtitle ? <Text style={styles.overviewTableHint}>{displayedPackageSubtitle}</Text> : null}
          </View>
        </TouchableOpacity>

        <View style={[styles.overviewTableRow, styles.overviewTableRowBorder]}>
          <View style={styles.overviewTableCell}>
            <Text style={styles.overviewTableLabel}>Items Swapped In</Text>
            <Text style={styles.overviewTableValue}>{itemsSwappedInSummary}</Text>
            <Text style={styles.overviewTableHint}>Accepted items / package total</Text>
          </View>
        </View>
      </View>

      <View style={styles.overviewActionGrid}>
        <TouchableOpacity style={styles.overviewActionButton} onPress={() => push('checkout', { email: customer.email })}>
          <Text style={styles.overviewActionTitle}>Checkout</Text>
          <Text style={styles.overviewActionSubtitle}>Checkout with points</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.overviewActionButton} onPress={() => push('buySubscription', { email: customer.email })}>
          <Text style={styles.overviewActionTitle}>Buy Subscription</Text>
          <Text style={styles.overviewActionSubtitle}>Buy or top up a plan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.overviewActionButton}
          onPress={() => {
            if (swapInTargetPickup) {
              push('customerPickupDetail', { email: customer.email, pickupId: swapInTargetPickup.id });
              return;
            }

            if (activeSubscription && canAddToSubscription) {
              push('customerSubscriptionDetail', {
                email: customer.email,
                subscriptionId: activeSubscription.id,
              });
              return;
            }

            push('customerPickups', { email: customer.email });
          }}
        >
          <Text style={styles.overviewActionTitle}>Swap In</Text>
          <Text style={styles.overviewActionSubtitle}>Add items to subscription or pickup</Text>
        </TouchableOpacity>

        {pendingReviewCount > 0 ? (
          <TouchableOpacity style={styles.overviewActionButton} onPress={() => push('approval', { email: customer.email })}>
            <Text style={styles.overviewActionTitle}>Review Points</Text>
            <Text style={styles.overviewActionSubtitle}>
              {pendingReviewCount} item{pendingReviewCount === 1 ? '' : 's'} pending review
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.overviewDivider} />

      <View style={styles.overviewMoreActionsPanel}>
        <TouchableOpacity style={styles.overviewMoreActionsHeader} onPress={() => setMoreActionsOpen((current) => !current)}>
          <Text style={styles.overviewMoreActionsTitle}>More Actions</Text>
          <Text style={styles.overviewMoreActionsToggle}>{moreActionsOpen ? 'Hide' : 'Show'}</Text>
        </TouchableOpacity>

        {moreActionsOpen ? (
          <View style={styles.overviewMoreActionsBody}>
            <TouchableOpacity style={styles.overviewSecondaryActionButton} onPress={() => push('customerSwappedIn', { email: customer.email })}>
              <Text style={styles.overviewSecondaryActionText}>All Items Swapped In</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.overviewSecondaryActionButton} onPress={() => push('customerOrders', { email: customer.email })}>
              <Text style={styles.overviewSecondaryActionText}>All Items Swapped Out</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.overviewSecondaryActionButton} onPress={() => push('customerSubscriptions', { email: customer.email })}>
              <Text style={styles.overviewSecondaryActionText}>All Subscriptions</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </ScreenShell>
  );
};
