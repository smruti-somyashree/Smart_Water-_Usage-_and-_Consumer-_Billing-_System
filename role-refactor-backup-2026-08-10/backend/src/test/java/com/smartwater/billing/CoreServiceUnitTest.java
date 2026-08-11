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
      al != null ? al : mock(AlertRepo.class),
      mock(UserRepo.class)
    );
  }

  @Test void appServiceCreatesHouseholdAndUsage() {
    ApartmentRepo apartments = mock(ApartmentRepo.class); HouseholdRepo households = mock(HouseholdRepo.class); UsageRepo usage = mock(UsageRepo.class);
    Apartment apartment = apartment(1L); Household household = household(2L, apartment, true);
    when(apartments.findById(1L)).thenReturn(Optional.of(apartment));
    when(households.findByApartmentIdAndFlatNumber(1L, "A-101")).thenReturn(Optional.empty());
    when(households.save(any(Household.class))).thenReturn(household);
    when(households.findById(2L)).thenReturn(Optional.of(household));
    when(usage.existsByHouseholdIdAndReadingDate(2L, LocalDate.now())).thenReturn(false);
    when(usage.save(any(WaterUsageLog.class))).thenAnswer(i -> { WaterUsageLog l = i.getArgument(0); l.id = 5L; return l; });

    AppService service = mockAppService(apartments, households, usage, null, null, null, null, null);
    HouseholdView hView = Views.household(service.createHousehold(1L, new HouseholdRequest("A-101", 900, 3, true)));
    UsageView uView = service.log(2L, new UsageRequest(LocalDate.now(), new BigDecimal("12.5")), UsageSource.MANUAL);

    assertEquals(2L, hView.id());
    assertEquals(5L, uView.id());
    assertEquals(new BigDecimal("12.5"), uView.meterReadingKl());
  }

  @Test void authServiceRegisterAndMe() {
    UserRepo users = mock(UserRepo.class); ApartmentRepo apartments = mock(ApartmentRepo.class); HouseholdRepo households = mock(HouseholdRepo.class); PasswordEncoder encoder = mock(PasswordEncoder.class); Jwt jwt = mock(Jwt.class);
    Apartment apt = apartment(1L); Household h = household(2L, apt, true); User u = user(3L, apt, h, "test@demo.local", Role.RESIDENT);
    when(users.existsByEmailIgnoreCase("test@demo.local")).thenReturn(false);
    when(apartments.findById(1L)).thenReturn(Optional.of(apt));
    when(households.findById(2L)).thenReturn(Optional.of(h));
    when(households.findByApartmentIdAndFlatNumber(1L, "A-101")).thenReturn(Optional.of(h));
    when(households.findByApartmentId(1L)).thenReturn(List.of(h));
    when(encoder.encode("password123")).thenReturn("hashed");
    when(users.save(any(User.class))).thenReturn(u);
    when(users.findByEmailIgnoreCase("test@demo.local")).thenReturn(Optional.empty()).thenReturn(Optional.of(u));

    AuthService service = new AuthService(users, apartments, households, encoder, jwt);
    User reg = service.register(new RegisterRequest(1L, 2L, "Test User", "test@demo.local", "password123", Role.RESIDENT, "A-101", 3, 1200));
    User me = service.me("test@demo.local");

    assertEquals("test@demo.local", reg.email);
    assertEquals("test@demo.local", me.email);
  }

  @Test void jwtBuildsSubjectAndRole() {
    Jwt jwt = new Jwt("very-long-secure-secret-key-for-jwt-testing-123456", 60L, 7L);
    User u = user(1L, apartment(1L), null, "admin@demo.local", Role.ADMIN);
    String token = jwt.access(u);
    var claims = jwt.parse(token);

    assertEquals("admin@demo.local", claims.getSubject());
    assertEquals("ADMIN", claims.get("role", String.class));
  }

  @Test void alertEngineServiceDetectsOveruseAndSpike() {
    HouseholdRepo households = mock(HouseholdRepo.class); UsageRepo usage = mock(UsageRepo.class); TariffPlanRepo plans = mock(TariffPlanRepo.class); AlertRepo alerts = mock(AlertRepo.class);
    Apartment apt = apartment(1L); Household h = household(2L, apt, true);
    TariffPlan tp = new TariffPlan(); tp.overuseThresholdKl = new BigDecimal("10.000");
    WaterUsageLog u1 = log(1L, h, LocalDate.now().minusDays(5), new BigDecimal("5.0"));
    WaterUsageLog u2 = log(2L, h, LocalDate.now().minusDays(4), new BigDecimal("5.0"));
    WaterUsageLog u3 = log(3L, h, LocalDate.now().minusDays(3), new BigDecimal("5.0"));
    WaterUsageLog u4 = log(4L, h, LocalDate.now().minusDays(2), new BigDecimal("5.0"));
    WaterUsageLog u5 = log(5L, h, LocalDate.now().minusDays(1), new BigDecimal("5.0"));
    WaterUsageLog u6 = log(6L, h, LocalDate.now(), new BigDecimal("50.0"));

    when(households.findAll()).thenReturn(List.of(h));
    when(usage.findByHouseholdIdOrderByReadingDateAsc(2L)).thenReturn(List.of(u1, u2, u3, u4, u5, u6));
    when(plans.findByApartmentId(1L)).thenReturn(List.of(tp));
    when(alerts.existsByHouseholdIdAndTypeAndMessage(anyLong(), anyString(), anyString())).thenReturn(false);
    when(alerts.findAll()).thenReturn(List.of());

    AlertEngineService engine = new AlertEngineService(households, usage, plans, alerts, new TransactionalEmailService());
    var audit = engine.evaluateAlerts();

    assertEquals(1, audit.householdsEvaluated());
    verify(alerts, times(2)).save(any(Alert.class));
  }

  private Apartment apartment(Long id) { Apartment a = new Apartment(); a.id = id; a.name = "Apt"; a.address = "Addr"; a.totalUnits = 10; return a; }
  private Household household(Long id, Apartment apt, boolean meter) { Household h = new Household(); h.id = id; h.apartment = apt; h.flatNumber = "A-101"; h.flatSizeSqft = 800; h.occupancyCount = 2; h.hasMeter = meter; return h; }
  private User user(Long id, Apartment apt, Household h, String email, Role role) { User u = new User(); u.id = id; u.apartment = apt; u.household = h; u.email = email; u.passwordHash = "hash"; u.role = role; return u; }
  private WaterUsageLog log(Long id, Household h, LocalDate d, BigDecimal val) { WaterUsageLog l = new WaterUsageLog(); l.id = id; l.household = h; l.readingDate = d; l.meterReadingKl = val; l.source = UsageSource.MANUAL; return l; }
}
