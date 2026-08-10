package com.smartwater.billing;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BillingEngineTest {

    @Mock private ApartmentRepo apartments;
    @Mock private HouseholdRepo households;
    @Mock private UsageRepo usage;
    @Mock private TariffPlanRepo tariffPlans;
    @Mock private BillingCycleRepo billingCycles;
    @Mock private WaterPurchaseRepo purchases;
    @Mock private InvoiceRepo invoices;
    @Mock private AlertRepo alerts;
    @Mock private UserRepo users;

    private AppService appService;

    @BeforeEach
    void setUp() {
        appService = new AppService(apartments, households, usage, tariffPlans, billingCycles, purchases, invoices, alerts, users);
    }

    @Test
    @DisplayName("Tiered Tariff Engine & Shared Allocation: calculates base, excess, and shared costs correctly")
    void testFinalizeCycleTieredAndSharedAllocation() {
        Apartment apt = new Apartment();
        apt.id = 1L;

        TariffPlan tp = new TariffPlan();
        tp.id = 10L;
        tp.apartment = apt;
        tp.baseThresholdKl = new BigDecimal("10");
        tp.baseRate = new BigDecimal("15");
        tp.excessRate = new BigDecimal("25");

        BillingCycle cycle = new BillingCycle();
        cycle.id = 100L;
        cycle.apartment = apt;
        cycle.tariffPlan = tp;
        cycle.startsOn = LocalDate.of(2026, 1, 1);
        cycle.endsOn = LocalDate.of(2026, 1, 31);
        cycle.status = CycleStatus.OPEN;

        Household h1 = new Household();
        h1.id = 1L;
        h1.apartment = apt;
        h1.flatNumber = "A-101";
        h1.flatSizeSqft = 1000;
        h1.hasMeter = true;

        Household h2 = new Household();
        h2.id = 2L;
        h2.apartment = apt;
        h2.flatNumber = "A-102";
        h2.flatSizeSqft = 500;
        h2.hasMeter = false;

        WaterUsageLog u1 = new WaterUsageLog();
        u1.household = h1;
        u1.meterReadingKl = new BigDecimal("15");

        WaterPurchase p1 = new WaterPurchase();
        p1.billingCycle = cycle;
        p1.volumeKl = new BigDecimal("10");
        p1.unitCost = new BigDecimal("100");

        when(billingCycles.findById(100L)).thenReturn(java.util.Optional.of(cycle));
        when(households.findByApartmentId(1L)).thenReturn(List.of(h1, h2));
        when(purchases.findByBillingCycleId(100L)).thenReturn(List.of(p1));
        when(usage.findByHouseholdIdAndReadingDateBetween(eq(1L), any(), any())).thenReturn(List.of(u1));
        when(invoices.save(any(Invoice.class))).thenAnswer(i -> i.getArgument(0));

        List<InvoiceView> res = appService.finalizeCycle(100L);

        assertEquals(2, res.size());

        InvoiceView invH1 = res.stream().filter(i -> i.householdId().equals(1L)).findFirst().orElseThrow();
        assertEquals(new BigDecimal("150.00"), invH1.baseAmount());
        assertEquals(new BigDecimal("125.00"), invH1.excessAmount());
        assertEquals(new BigDecimal("1000.00"), invH1.sharedAmount());
        assertEquals(new BigDecimal("1275.00"), invH1.totalAmount());

        InvoiceView invH2 = res.stream().filter(i -> i.householdId().equals(2L)).findFirst().orElseThrow();
        assertEquals(new BigDecimal("0.00"), invH2.baseAmount());
        assertEquals(new BigDecimal("0.00"), invH2.excessAmount());
        assertEquals(new BigDecimal("1000.00"), invH2.sharedAmount());
        assertEquals(new BigDecimal("1000.00"), invH2.totalAmount());
        assertEquals(CycleStatus.FINALIZED, cycle.status);
    }
}
