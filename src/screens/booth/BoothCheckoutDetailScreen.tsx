import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { getBoothCheckout } from '../../api/swapOpsApi';
import { BoothProductComponent } from '../../components/BoothProductComponent';
import { ScreenShell } from '../../components/ScreenShell';
import { useLoader } from '../../utils/LoaderContextShared';
import { styles } from '../../styles/commonStyles';

export const BoothCheckoutDetailScreen = ({ pop, push, checkoutId }) => {
  const [checkout, setCheckout] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState('');
  const { withLoader } = useLoader();

  useEffect(() => {
    let active = true;

    const loadCheckout = async () => {
      setError('');

      try {
        const response = await withLoader(getBoothCheckout(checkoutId));
        if (!active) {
          return;
        }

        setCheckout(response.checkout);
        setHasLoaded(true);
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Unable to load checkout');
          setHasLoaded(true);
        }
      }
    };

    loadCheckout();

    return () => {
      active = false;
    };
  }, [checkoutId, withLoader]);

  const totalItems = useMemo(
    () => (checkout?.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [checkout]
  );

  return (
    <ScreenShell
      title={`Checkout #${checkoutId || ''}`}
      subtitle={error || (checkout ? new Date(checkout.checkout_date).toLocaleString() : 'Checkout detail')}
      onBack={pop}
      backgroundColor="#eff6ff"
    >
      {checkout ? (
        <>
          <View style={styles.checkoutDetailSummaryFullBleed}>
            <View style={styles.checkoutSummaryCard}>
              <View style={styles.checkoutSummaryHeader}>
                <Text style={styles.checkoutSummaryHeaderText}>Summary</Text>
              </View>
              <View style={styles.checkoutSummaryBody}>
                <View style={styles.checkoutDetailTable}>
                  <View style={[styles.checkoutDetailTableRow, styles.checkoutDetailTableRowBorder]}>
                    <View style={styles.checkoutDetailTableCellFull}>
                      <Text style={styles.checkoutDetailTableLabel}>Payment Method</Text>
                      <Text style={styles.checkoutDetailTableValue}>{checkout.Booth_payment_method?.method || 'NA'}</Text>
                    </View>
                  </View>
                  <View style={styles.checkoutDetailTableRow}>
                    <View style={[styles.checkoutDetailTableCell, styles.checkoutDetailTableCellDivider]}>
                      <Text style={styles.checkoutDetailTableLabel}>Number of Items</Text>
                      <Text style={styles.checkoutDetailTableValue}>{totalItems}</Text>
                    </View>
                    <View style={styles.checkoutDetailTableCell}>
                      <Text style={styles.checkoutDetailTableLabel}>Total Price</Text>
                      <Text style={styles.checkoutDetailTableValue}>${Number(checkout.Cart_value || 0).toFixed(2)}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {(checkout.items || []).map((item, index) => (
            <BoothProductComponent key={`${item.booth_product?.id || 'item'}-${index}`} item={item} />
          ))}
        </>
      ) : null}

      {hasLoaded && !checkout ? (
        <View style={styles.formCard}>
          <Text style={[styles.cardTitle, { textAlign: 'center' }]}>Checkout not found</Text>
          <Text style={[styles.helperText, { textAlign: 'center' }]}>This sale record is missing from the current mock store.</Text>
        </View>
      ) : null}
    </ScreenShell>
  );
};
