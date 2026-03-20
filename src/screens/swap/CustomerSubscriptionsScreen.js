import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Row } from '../../components/Row';
import { ScreenShell } from '../../components/ScreenShell';
import { formatRemainingItems, getCustomerProfile } from '../../data/mockData';
import { styles } from '../../styles/commonStyles';

export const CustomerSubscriptionsScreen = ({ pop, push, customerEmail }) => {
  const customer = getCustomerProfile(customerEmail);

  return (
    <ScreenShell title="Subscriptions" subtitle={`${customer.name} subscription history`} onBack={pop} backgroundColor="#ffe4e1">
      {customer.subscriptions.map((subscription) => (
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
