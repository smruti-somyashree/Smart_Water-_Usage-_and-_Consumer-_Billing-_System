package com.smartwater.billing;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

class CoreServiceUnitTest {
  private AppService mockAppService(ApartmentRepo a, HouseholdRepo h, UsageRepo u, TariffPlanRepo tp, BillingCycleRepo bc, WaterPurchaseRepo p, InvoiceRepo i, AlertRepo al) {
    return new AppService(
      a != null ? a : mock(ApartmentRepo.class),
      h != null ? h : mock(HouseholdRepo.class),
      u != null ? u : mock(UsageRepo.class),
      tp != null ? tp : mock(TariffPlanRepo.class),
      bc != null ? bc : mock(BillingCycleRepo.class),
      p != null ? p : mock(WaterPurchaseRepo.class),
      i != null ? i : mock(InvoiceRepo.class),
      al != null ? al : mock(AlertRepo.class)
    );
  }

  @Test void appServiceCreatesHouseholdAndUsage() {
    ApartmentRepo apartments = mock(ApartmentRepo.class); HouseholdRepo households = mock(HouseholdRepo.class); UsageRepo usage = mock(UsageRepo.class);
    Apartment apartment = apartment(1L); Household household = household(2L, apartment, true);
    when(apartments.findById(1L)).thenReturn(Optional.of(apartment)); when(households.findByApartmentIdAndFlatNumber(1L, "A-101")).thenReturn(Optional.empty());
    when(households.save(any())).thenAnswer(i -> { Household h=i.getArgument(0); h.id=2L; return h; });
    when(usage.save(any())).thenAnswer(i -> { WaterUsageLog l=i.getArgument(0); l.id=3L; return l; });
    AppService service = mockAppService(apartments, households, usage, null, null, null, null, null);
    assertEquals("A-101", service.createHousehold(1L, new HouseholdRequest("A-101", 800, 3, true)).flatNumber);
    when(households.findById(2L)).thenReturn(Optional.of(household));
    assertEquals(UsageSource.MANUAL, service.log(2L, new UsageRequest(LocalDate.now(), new BigDecimal("1.250")), UsageSource.MANUAL).source());
  }

  @Test void appServiceRejectsDuplicateFlatAndMissingHousehold() {
    ApartmentRepo apartments = mock(ApartmentRepo.class); HouseholdRepo households = mock(HouseholdRepo.class); UsageRepo usage = mock(UsageRepo.class);
    Apartment apartment = apartment(1L); when(apartments.findById(1L)).thenReturn(Optional.of(apartment)); when(households.findByApartmentIdAndFlatNumber(1L, "A-101")).thenReturn(Optional.of(household(2L, apartment, true)));
    AppService service = mockAppService(apartments, households, usage, null, null, null, null, null);
    assertThrows(Duplicate.class, () -> service.createHousehold(1L, new HouseholdRequest("A-101", 800, 3, true)));
    when(households.findById(99L)).thenReturn(Optional.empty());
    assertThrows(NotFound.class, () -> service.log(99L, new UsageRequest(LocalDate.now(), BigDecimal.ONE), UsageSource.MANUAL));
  }

  @Test void appServiceRejectsMeterlessAndDuplicateReadings() {
    ApartmentRepo apartments = mock(ApartmentRepo.class); HouseholdRepo households = mock(HouseholdRepo.class); UsageRepo usage = mock(UsageRepo.class);
    AppService service = mockAppService(apartments, households, usage, null, null, null, null, null); Apartment apartment = apartment(1L);
    when(households.findById(2L)).thenReturn(Optional.of(household(2L, apartment, false)));
    assertThrows(Invalid.class, () -> service.log(2L, new UsageRequest(LocalDate.now(), BigDecimal.ONE), UsageSource.MANUAL));
    when(households.findById(2L)).thenReturn(Optional.of(household(2L, apartment, true))); when(usage.existsByHouseholdIdAndReadingDate(2L, LocalDate.now())).thenReturn(true);
    assertThrows(Duplicate.class, () -> service.log(2L, new UsageRequest(LocalDate.now(), BigDecimal.ONE), UsageSource.MANUAL));
  }

  @Test void authServiceRegistersAndLogsIn() {
    UserRepo users = mock(UserRepo.class); ApartmentRepo apartments = mock(ApartmentRepo.class); HouseholdRepo households = mock(HouseholdRepo.class); PasswordEncoder encoder = mock(PasswordEncoder.class); Jwt jwt = mock(Jwt.class);
    Apartment apartment = apartment(1L); Household household = household(2L, apartment, true); when(apartments.findById(1L)).thenReturn(Optional.of(apartment)); when(households.findById(2L)).thenReturn(Optional.of(household)); when(users.save(any())).thenAnswer(i -> { User u=i.getArgument(0); u.id=3L; return u; }); when(encoder.encode("password123")).thenReturn("hash");
    AuthService service = new AuthService(users, apartments, households, encoder, jwt);
    User registered = service.register(new RegisterRequest(1L, 2L, "Resident@Example.com", "password123", Role.RESIDENT)); assertEquals("resident@example.com", registered.email);
    when(users.findByEmailIgnoreCase("resident@example.com")).thenReturn(Optional.of(registered)); when(encoder.matches("password123", "hash")).thenReturn(true); when(jwt.access(registered)).thenReturn("access"); when(jwt.refresh(registered)).thenReturn("refresh");
    assertEquals("access", service.login(new LoginRequest("resident@example.com", "password123")).accessToken());
  }

  @Test void authServiceRejectsDuplicateAndInvalidResident() {
    UserRepo users = mock(UserRepo.class); ApartmentRepo apartments = mock(ApartmentRepo.class); HouseholdRepo households = mock(HouseholdRepo.class); PasswordEncoder encoder = mock(PasswordEncoder.class); Jwt jwt = mock(Jwt.class);
    AuthService service = new AuthService(users, apartments, households, encoder, jwt); when(users.existsByEmailIgnoreCase("x@example.com")).thenReturn(true);
    assertThrows(Duplicate.class, () -> service.register(new RegisterRequest(1L, null, "x@example.com", "password123", Role.ADMIN)));
    when(users.existsByEmailIgnoreCase("x@example.com")).thenReturn(false); when(apartments.findById(1L)).thenReturn(Optional.of(apartment(1L)));
    assertThrows(Invalid.class, () -> service.register(new RegisterRequest(1L, null, "x@example.com", "password123", Role.RESIDENT)));
  }

  @Test void authServiceRejectsBadCredentials() {
    UserRepo users = mock(UserRepo.class); AuthService service = new AuthService(users, mock(ApartmentRepo.class), mock(HouseholdRepo.class), mock(PasswordEncoder.class), mock(Jwt.class));
    when(users.findByEmailIgnoreCase("missing@example.com")).thenReturn(Optional.empty());
    assertThrows(Unauthorized.class, () -> service.login(new LoginRequest("missing@example.com", "wrong")));
  }

  @Test void tariffPlanAndBillingCycleServicesWork() {
    ApartmentRepo apartments = mock(ApartmentRepo.class); TariffPlanRepo tariffPlans = mock(TariffPlanRepo.class); BillingCycleRepo billingCycles = mock(BillingCycleRepo.class);
    Apartment apartment = apartment(1L); when(apartments.findById(1L)).thenReturn(Optional.of(apartment));
    when(tariffPlans.save(any())).thenAnswer(i -> { TariffPlan tp = i.getArgument(0); tp.id = 10L; return tp; });
    when(billingCycles.save(any())).thenAnswer(i -> { BillingCycle bc = i.getArgument(0); bc.id = 20L; return bc; });

    AppService service = mockAppService(apartments, null, null, tariffPlans, billingCycles, null, null, null);
    TariffPlan plan = service.createPlan(1L, new TariffPlanRequest("July Plan", new BigDecimal("10.0"), new BigDecimal("2.0"), new BigDecimal("3.0"), new BigDecimal("20.0"), true));
    assertEquals("July Plan", plan.name);

    when(tariffPlans.findById(10L)).thenReturn(Optional.of(plan));
    BillingCycle cycle = service.createCycle(1L, new BillingCycleRequest(10L, LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 31)));
    assertEquals(CycleStatus.OPEN, cycle.status);
  }

  private static Apartment apartment(Long id) { Apartment a = new Apartment(); a.id=id; a.name="Demo"; return a; }
  private static Household household(Long id, Apartment apartment, boolean meter) { Household h = new Household(); h.id=id; h.apartment=apartment; h.flatNumber="A-101"; h.hasMeter=meter; return h; }
}
