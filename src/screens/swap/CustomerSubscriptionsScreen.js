import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { formatRemainingItems, getCustomerProfile, getCustomerSubscriptions } from '../../api/swapOpsApi';
import { Row } from '../../components/Row';
import { ScreenShell } from '../../components/ScreenShell';
import { useLoader } from '../../context/LoaderContext';
import { styles } from '../../styles/commonStyles';

export const CustomerSubscriptionsScreen = ({ pop, push, customerEmail }) => {
  const [customer, setCustomer] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [error, setError] = useState('');
  const { withLoader } = useLoader();

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        setError('');
        const [profile, subscriptionList] = await withLoader(
          Promise.all([
            getCustomerProfile(customerEmail),
            getCustomerSubscriptions(customerEmail),
          ]),
          'Loading subscriptions...'
        );

        if (!active) {
          return;
        }

        setCustomer(profile);
        setSubscriptions(subscriptionList);
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Failed to load subscriptions');
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [customerEmail, withLoader]);

  if (!customer) {
    return (
      <ScreenShell title="Subscriptions" subtitle={error || 'Loading subscription history...'} onBack={pop} backgroundColor="#ffe4e1">
        <Text>{error || 'Loading...'}</Text>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="Subscriptions" subtitle={`${customer.name} subscription history`} onBack={pop} backgroundColor="#ffe4e1">
      {subscriptions.map((subscription) => (
        <TouchableOpacity
          key={subscription.id}
          onPress={() => push('customerSubscriptionDetail', { email: customer.email, subscriptionId: subscription.id })}
          style={styles.pressableListItem}
        >
          <Row label="Subscription Id" value={subscription.id} />
          <Row label="Plan" value={subscription.plan} />
          <Row label="Status" value={subscription.status} />
          <Row label="Start Date" value={subscription.startDate} />
          <Row label="Renewal Date" value={subscription.renewalDate} />
          <Row label="Items Remaining" value={formatRemainingItems(subscription.itemsRemaining)} />
        </TouchableOpacity>
      ))}
    </ScreenShell>
  );
};
