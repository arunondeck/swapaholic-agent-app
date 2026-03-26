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

  const itemsSwappedInSummary = useMemo(() => {
    const totals = pickups.reduce(
      (summary, pickup) => {
        const available = Number.parseInt(String(pickup.totalItems || 0), 10) || 0;
        const remaining = Number.parseInt(String(pickup.remainingItems || 0), 10) || 0;
        const swappedIn = Math.max(available - remaining, 0);

        return {
          swappedIn: summary.swappedIn + swappedIn,
          available: summary.available + available,
        };
      },
      { swappedIn: 0, available: 0 }
    );

    return `${totals.swappedIn}/${totals.available}`;
  }, [pickups]);

  if (!customer) {
    return (
      <ScreenShell title="Customer" subtitle={error || 'Loading customer details...'} onBack={pop} backgroundColor="#e7f7ef">
        {error ? <Text>{error}</Text> : null}
      </ScreenShell>
    );
  }

  const swapInTargetPickup = pickups.find((pickup) => Number.parseInt(String(pickup.remainingItems || 0), 10) > 0);
  const canAddToSubscription = Number.parseInt(String(activeSubscription?.itemsRemaining || 0), 10) > 0;
  const activePackageSubtitle = activeSubscription
    ? `${activeSubscription.status} | Renews ${activeSubscription.renewalDate || 'NA'}`
    : 'No active package found';

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

        <View style={[styles.overviewTableRow, styles.overviewTableRowBorder]}>
          <TouchableOpacity
            activeOpacity={activeSubscription ? 0.8 : 1}
            onPress={
              activeSubscription
                ? () =>
                    push('customerSubscriptionDetail', {
                      email: customer.email,
                      subscriptionId: activeSubscription.id,
                    })
                : undefined
            }
            style={[styles.overviewTableCell, styles.overviewTableCellWithDivider]}
          >
            <Text style={styles.overviewTableLabel}>Active Package</Text>
            <Text style={[styles.overviewTableValue, activeSubscription ? styles.overviewTableLinkValue : null]}>
              {activeSubscription?.plan || customer.activePackage}
            </Text>
            <Text style={styles.overviewTableHint}>{activePackageSubtitle}</Text>
          </TouchableOpacity>

          <View style={styles.overviewTableCell}>
            <Text style={styles.overviewTableLabel}>Items Swapped In</Text>
            <Text style={styles.overviewTableValue}>{itemsSwappedInSummary}</Text>
            <Text style={styles.overviewTableHint}>Used / total pickup capacity</Text>
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
