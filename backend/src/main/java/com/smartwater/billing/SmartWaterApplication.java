package com.smartwater.billing;

import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.jsonwebtoken.Claims; import io.jsonwebtoken.Jwts; import io.jsonwebtoken.security.Keys;
import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import jakarta.persistence.*; import jakarta.servlet.*; import jakarta.servlet.http.*; import jakarta.validation.Valid; import jakarta.validation.constraints.*;
import org.springframework.beans.factory.annotation.Value; import org.springframework.boot.*; import org.springframework.boot.autoconfigure.SpringBootApplication; import org.springframework.context.annotation.*; import org.springframework.dao.DataIntegrityViolationException; import org.springframework.data.jpa.repository.JpaRepository; import org.springframework.http.*; import org.springframework.scheduling.annotation.EnableScheduling; import org.springframework.scheduling.annotation.Scheduled; import org.springframework.security.access.prepost.PreAuthorize; import org.springframework.security.authentication.UsernamePasswordAuthenticationToken; import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity; import org.springframework.security.config.annotation.web.builders.HttpSecurity; import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity; import org.springframework.security.config.http.SessionCreationPolicy; import org.springframework.security.core.*; import org.springframework.security.core.authority.SimpleGrantedAuthority; import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder; import org.springframework.security.crypto.password.PasswordEncoder; import org.springframework.security.web.*; import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter; import org.springframework.stereotype.*; import org.springframework.transaction.annotation.Transactional; import org.springframework.web.bind.annotation.*; import org.springframework.web.multipart.MultipartFile;
import java.io.*; import java.math.BigDecimal; import java.math.RoundingMode; import java.nio.charset.StandardCharsets; import java.security.Key; import java.time.*; import java.util.*; import java.util.stream.*;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;


@SecurityScheme(
  name = "Bearer Auth",
  type = SecuritySchemeType.HTTP,
  bearerFormat = "JWT",
  scheme = "bearer"
)
@OpenAPIDefinition(
  info = @Info(title = "Smart Water Billing System API", version = "0.1.0"),
  security = @SecurityRequirement(name = "Bearer Auth")
)
@EnableScheduling
@SpringBootApplication public class SmartWaterApplication { public static void main(String[] a){SpringApplication.run(SmartWaterApplication.class,a);} }

enum Role { SUPER_ADMIN, COMMUNITY_ADMIN, RESIDENT } enum UsageSource { MANUAL, CSV_BULK } enum CycleStatus { OPEN, FINALIZED, ARCHIVED }

@Entity @Table(name="apartments") class Apartment {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
  String name; String address; int totalUnits; Instant createdAt=Instant.now();
  @OneToMany(mappedBy="apartment", cascade=CascadeType.ALL, orphanRemoval=true) @JsonIgnore List<Household> households=new ArrayList<>();
  @OneToMany(mappedBy="apartment", cascade=CascadeType.ALL, orphanRemoval=true) @JsonIgnore List<TariffPlan> tariffPlans=new ArrayList<>();
  @OneToMany(mappedBy="apartment", cascade=CascadeType.ALL, orphanRemoval=true) @JsonIgnore List<BillingCycle> billingCycles=new ArrayList<>();
}
@Entity @Table(name="households") class Household {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
  // SUPER_ADMIN is intentionally platform-scoped and therefore has no apartment.
  @ManyToOne Apartment apartment;
  String flatNumber; int flatSizeSqft; int occupancyCount; boolean hasMeter;
  @OneToMany(mappedBy="household", cascade=CascadeType.ALL, orphanRemoval=true) @JsonIgnore List<WaterUsageLog> usageLogs=new ArrayList<>();
}
@Entity @Table(name="users") class User {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
  @ManyToOne Household household;
  @ManyToOne(optional=false) Apartment apartment;
  String name;
  String email; @JsonIgnore String passwordHash;
  @Enumerated(EnumType.STRING) Role role;
  String status = "APPROVED";
  Instant createdAt=Instant.now();
}
@Entity @Table(name="water_usage_logs", uniqueConstraints=@UniqueConstraint(columnNames={"household_id","reading_date"})) class WaterUsageLog {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
  String readingCode;
  @ManyToOne(optional=false) Household household;
  LocalDate readingDate;
  @Column(precision=12,scale=3) BigDecimal meterReadingKl;
  @Enumerated(EnumType.STRING) UsageSource source; Instant createdAt=Instant.now();
}
@Entity @Table(name="tariff_plans") class TariffPlan {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
  @ManyToOne(optional=false) Apartment apartment;
  String name;
  @Column(precision=12,scale=3) BigDecimal baseThresholdKl;
  @Column(precision=12,scale=3) BigDecimal baseRate;
  @Column(precision=12,scale=3) BigDecimal excessRate;
  @Column(precision=12,scale=3) BigDecimal overuseThresholdKl;
  boolean active=true; Instant createdAt=Instant.now();
}
@Entity @Table(name="billing_cycles") class BillingCycle {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
  String cycleCode;
  @ManyToOne(optional=false) Apartment apartment;
  @ManyToOne(optional=false) TariffPlan tariffPlan;
  LocalDate startsOn; LocalDate endsOn;
  @Enumerated(EnumType.STRING) CycleStatus status=CycleStatus.OPEN; Instant createdAt=Instant.now();
}
@Entity @Table(name="water_purchases") class WaterPurchase {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
  String procurementCode;
  @ManyToOne(optional=false) BillingCycle billingCycle;
  String source; LocalDate purchasedOn;
  @Column(precision=12,scale=3) BigDecimal volumeKl;
  @Column(precision=12,scale=3) BigDecimal unitCost;
  String notes; Instant createdAt=Instant.now();
}
@Entity @Table(name="invoices", uniqueConstraints=@UniqueConstraint(columnNames={"billing_cycle_id","household_id"})) class Invoice {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
  @ManyToOne(optional=false) BillingCycle billingCycle;
  @ManyToOne(optional=false) Household household;
  @Column(precision=12,scale=3) BigDecimal consumptionKl;
  @Column(precision=12,scale=2) BigDecimal baseAmount;
  @Column(precision=12,scale=2) BigDecimal excessAmount;
  @Column(precision=12,scale=2) BigDecimal sharedAmount;
  @Column(precision=12,scale=2) BigDecimal totalAmount;
  String status = "UNPAID";
  String invoiceCode;
  String paymentMethod;
  String transactionRef;
  Instant paidAt;
  Instant createdAt=Instant.now();
}
@Entity @Table(name="alerts") class Alert {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
  @ManyToOne Apartment apartment;
  @ManyToOne Household household;
  String type; String message; boolean resolved=false; Instant createdAt=Instant.now();
}
@Entity @Table(name="resident_messages") class ResidentMessage {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
  @ManyToOne User user;
  @ManyToOne Household household;
  String flatNumber;
  String residentName;
  String subject;
  @Column(columnDefinition="TEXT", nullable=false) String message;
  String status = "UNREAD";
  Instant createdAt = Instant.now();
}

interface ApartmentRepo extends JpaRepository<Apartment,Long>{}
interface HouseholdRepo extends JpaRepository<Household,Long>{ Optional<Household> findByApartmentIdAndFlatNumber(Long a,String f); List<Household> findByApartmentId(Long a); }
interface UserRepo extends JpaRepository<User,Long>{ Optional<User> findByEmailIgnoreCase(String e); boolean existsByEmailIgnoreCase(String e); }
interface UsageRepo extends JpaRepository<WaterUsageLog,Long>{ boolean existsByHouseholdIdAndReadingDate(Long h,LocalDate d); List<WaterUsageLog> findByHouseholdIdAndReadingDateBetween(Long h, LocalDate start, LocalDate end); List<WaterUsageLog> findByHouseholdIdOrderByReadingDateAsc(Long h); List<WaterUsageLog> findAll(); }
interface TariffPlanRepo extends JpaRepository<TariffPlan,Long>{ List<TariffPlan> findByApartmentId(Long a); }
interface BillingCycleRepo extends JpaRepository<BillingCycle,Long>{ List<BillingCycle> findByApartmentId(Long a); List<BillingCycle> findByApartmentIdOrderByStartsOnDesc(Long a); long countByApartmentId(Long a); }
interface WaterPurchaseRepo extends JpaRepository<WaterPurchase,Long>{ List<WaterPurchase> findByBillingCycleId(Long c); List<WaterPurchase> findByBillingCycleIdOrderByPurchasedOnDesc(Long c); List<WaterPurchase> findAll(); }
interface InvoiceRepo extends JpaRepository<Invoice,Long>{ List<Invoice> findByBillingCycleId(Long c); List<Invoice> findByBillingCycleIdOrderByIdDesc(Long c); List<Invoice> findAll(); }
interface AlertRepo extends JpaRepository<Alert,Long>{ List<Alert> findAll(); List<Alert> findAllByOrderByIdDesc(); boolean existsByHouseholdIdAndTypeAndMessage(Long h, String type, String message); }
interface ResidentMessageRepo extends JpaRepository<ResidentMessage,Long>{ List<ResidentMessage> findAllByOrderByIdDesc(); List<ResidentMessage> findByHouseholdIdOrderByIdDesc(Long householdId); }

record RegisterRequest(Long apartmentId, Long householdId, String name, @NotBlank @Email String email, @NotBlank @Size(min=8,max=72) String password, @NotNull Role role, String flatNumber, Integer occupancyCount, Integer flatSizeSqft){}
record LoginRequest(@NotBlank @Email String email,@NotBlank String password){}
record AuthResponse(String accessToken,String refreshToken,UserView user){}
record ApartmentRequest(@NotBlank @Size(max=120) String name,@NotBlank @Size(max=300) String address,@Positive int totalUnits){}
record HouseholdRequest(@NotBlank @Size(max=30) String flatNumber,@Positive int flatSizeSqft,@Positive int occupancyCount,boolean hasMeter){}
record MeterRequest(boolean hasMeter){}
record UsageRequest(@NotNull @PastOrPresent LocalDate readingDate,@NotNull @DecimalMin("0.0") BigDecimal meterReadingKl){}
record UserUpdateRequest(String name, String email, String flatNumber){}
record AdminMessageRequest(Long householdId, String flatNumber, String category, @NotBlank String message){}
record PaymentRequest(String paymentMethod, String transactionRef){}
record ResidentMessageReq(String subject, @NotBlank String message){}
record ResidentMessageView(Long id, Long userId, Long householdId, String flatNumber, String residentName, String subject, String message, String status, String createdAt){}


record TariffPlanRequest(@NotBlank String name, @NotNull @DecimalMin("0.0") BigDecimal baseThresholdKl, @NotNull @DecimalMin("0.0") BigDecimal baseRate, @NotNull @DecimalMin("0.0") BigDecimal excessRate, @NotNull @DecimalMin("0.0") BigDecimal overuseThresholdKl, Boolean active){}
record BillingCycleRequest(Long tariffPlanId, @NotNull LocalDate startsOn, @NotNull LocalDate endsOn){}
record WaterPurchaseRequest(@NotBlank String source, @NotNull LocalDate purchasedOn, @NotNull @DecimalMin(value="0.01", message="Volume must be greater than 0") BigDecimal volumeKl, @NotNull @DecimalMin(value="0.01", message="Unit cost must be greater than 0") BigDecimal unitCost, String notes){}
record DirectWaterPurchaseRequest(Long billingCycleId, @NotBlank String source, @NotNull LocalDate purchasedOn, @NotNull @DecimalMin(value="0.01", message="Volume must be greater than 0") BigDecimal volumeKl, @NotNull @DecimalMin(value="0.01", message="Unit cost must be greater than 0") BigDecimal unitCost, String notes){}
record CommunityAdminRequest(@NotBlank String name, @NotBlank @Email String email, @NotBlank @Size(min=8,max=72) String password){}

record DashboardSummary(
  long totalHouseholds,
  long meteredHouseholds,
  long unmeteredHouseholds,
  String activeCycleStatus,
  BigDecimal totalWaterPurchasedKl,
  BigDecimal totalWaterConsumedKl,
  BigDecimal totalRevenue,
  long pendingBillsCount,
  long paidBillsCount,
  long leakAlertsCount
){}

record ApartmentView(Long id,String name,String address,int totalUnits){}
record HouseholdView(Long id,Long apartmentId,String flatNumber,int flatSizeSqft,int occupancyCount,boolean hasMeter){}
record UserView(Long id,Long householdId,Long apartmentId,String name,String email,Role role,String flatNumber,String status){}


record UsageView(Long id,String readingCode,Long householdId,String flatNumber,LocalDate readingDate,BigDecimal meterReadingKl,UsageSource source){}
record TariffPlanView(Long id,Long apartmentId,String name,BigDecimal baseThresholdKl,BigDecimal baseRate,BigDecimal excessRate,BigDecimal overuseThresholdKl,boolean active){}
record BillingCycleView(Long id,String cycleCode,Long apartmentId,Long tariffPlanId,String tariffPlanName,LocalDate startsOn,LocalDate endsOn,CycleStatus status){}
record WaterPurchaseView(Long id,String procurementCode,Long billingCycleId,String cycleCode,String source,LocalDate purchasedOn,BigDecimal volumeKl,BigDecimal unitCost,BigDecimal totalCost,String notes,String createdAt){}
record InvoiceView(Long id,String invoiceCode,Long billingCycleId,String cycleCode,Long householdId,String flatNumber,BigDecimal consumptionKl,BigDecimal baseAmount,BigDecimal excessAmount,BigDecimal sharedAmount,BigDecimal totalAmount,String status,String paymentMethod,String transactionRef,String paidAt){}
record AlertView(Long id,String alertCode,Long apartmentId,Long householdId,String flatNumber,String type,String message,boolean resolved){}
record AlertAuditResult(String lastEvaluatedAt, int householdsEvaluated, int alertsTriggered, List<AlertView> alerts){}
record BenchmarkView(Long householdId, String flatNumber, BigDecimal householdConsumptionKl, BigDecimal apartmentAverageKl, BigDecimal similarSizedAverageKl, int percentileRank, String conservationBadge){}
record ApiError(String code,String message,Map<String,String> fields){}

class Views {
  static ApartmentView apartment(Apartment a){return new ApartmentView(a.id,a.name,a.address,a.totalUnits);}
  static HouseholdView household(Household h){return new HouseholdView(h.id,h.apartment.id,h.flatNumber,h.flatSizeSqft,h.occupancyCount,h.hasMeter);}
  static UserView user(User u){
    String flat = u.household != null ? u.household.flatNumber : null;
    String name = u.name != null && !u.name.isBlank() ? u.name : (u.role == Role.SUPER_ADMIN ? "Platform Administrator" : (u.role == Role.COMMUNITY_ADMIN ? "Community Administrator" : null));
    String st = u.status != null ? u.status : "APPROVED";
    return new UserView(u.id, u.household != null ? u.household.id : null, u.apartment != null ? u.apartment.id : null, name, u.email, u.role, flat, st);
  }

  static UsageView usage(WaterUsageLog l){
    String code = (l.readingCode != null && !l.readingCode.isBlank()) ? l.readingCode : ("MR-" + String.format("%03d", l.id));
    return new UsageView(l.id, code, l.household.id, l.household.flatNumber, l.readingDate, l.meterReadingKl, l.source);
  }
  static TariffPlanView plan(TariffPlan p){return new TariffPlanView(p.id,p.apartment.id,p.name,p.baseThresholdKl,p.baseRate,p.excessRate,p.overuseThresholdKl,p.active);}
  static BillingCycleView cycle(BillingCycle c){
    String code = (c.cycleCode != null && !c.cycleCode.isBlank()) ? c.cycleCode : ("BC-" + String.format("%03d", c.id));
    String planName = (c.tariffPlan != null && c.tariffPlan.name != null) ? c.tariffPlan.name : "Standard Plan";
    return new BillingCycleView(c.id, code, c.apartment.id, c.tariffPlan != null ? c.tariffPlan.id : null, planName, c.startsOn, c.endsOn, c.status);
  }
  static WaterPurchaseView purchase(WaterPurchase p){
    BigDecimal total = p.volumeKl.multiply(p.unitCost).setScale(2, RoundingMode.HALF_UP);
    String pCode = (p.procurementCode != null && !p.procurementCode.isBlank()) ? p.procurementCode : ("PR-" + String.format("%03d", p.id));
    String cCode = p.billingCycle != null ? ((p.billingCycle.cycleCode != null && !p.billingCycle.cycleCode.isBlank()) ? p.billingCycle.cycleCode : ("BC-" + String.format("%03d", p.billingCycle.id))) : null;
    return new WaterPurchaseView(p.id, pCode, p.billingCycle.id, cCode, p.source, p.purchasedOn, p.volumeKl, p.unitCost, total, p.notes, p.createdAt.toString());
  }
  static InvoiceView invoice(Invoice i){
    String code = i.invoiceCode != null ? i.invoiceCode : "INV-" + String.format("%04d", i.id);
    String pAt = i.paidAt != null ? i.paidAt.toString() : null;
    return new InvoiceView(i.id, code, i.billingCycle.id, i.billingCycle.cycleCode, i.household.id, i.household.flatNumber, i.consumptionKl, i.baseAmount, i.excessAmount, i.sharedAmount, i.totalAmount, i.status, i.paymentMethod, i.transactionRef, pAt);
  }
  static ResidentMessageView residentMessage(ResidentMessage m){
    return new ResidentMessageView(m.id, m.user != null ? m.user.id : null, m.household != null ? m.household.id : null, m.flatNumber, m.residentName, m.subject, m.message, m.status, m.createdAt != null ? m.createdAt.toString() : null);
  }
  static AlertView alert(Alert a){
    String altCode = "ALT-" + String.format("%03d", a.id);
    return new AlertView(a.id, altCode, a.apartment==null?null:a.apartment.id, a.household==null?null:a.household.id, a.household==null?null:a.household.flatNumber, a.type, a.message, a.resolved);
  }
}

@Service class AppService {
  final ApartmentRepo apartments; final HouseholdRepo households; final UsageRepo usage;
  final TariffPlanRepo tariffPlans; final BillingCycleRepo billingCycles; final WaterPurchaseRepo purchases;
  final InvoiceRepo invoices; final AlertRepo alerts; final UserRepo users;
  final AlertEngineService alertEngine; final ResidentMessageRepo residentMessages;

  AppService(ApartmentRepo a,HouseholdRepo h,UsageRepo u,TariffPlanRepo tp,BillingCycleRepo bc,WaterPurchaseRepo p,InvoiceRepo i,AlertRepo al,UserRepo us){
    this(a,h,u,tp,bc,p,i,al,us,null,null);
  }
  AppService(ApartmentRepo a,HouseholdRepo h,UsageRepo u,TariffPlanRepo tp,BillingCycleRepo bc,WaterPurchaseRepo p,InvoiceRepo i,AlertRepo al,UserRepo us,AlertEngineService ae){
    this(a,h,u,tp,bc,p,i,al,us,ae,null);
  }
  @org.springframework.beans.factory.annotation.Autowired
  AppService(ApartmentRepo a,HouseholdRepo h,UsageRepo u,TariffPlanRepo tp,BillingCycleRepo bc,WaterPurchaseRepo p,InvoiceRepo i,AlertRepo al,UserRepo us,AlertEngineService ae,ResidentMessageRepo rm){
    apartments=a;households=h;usage=u;tariffPlans=tp;billingCycles=bc;purchases=p;invoices=i;alerts=al;users=us;alertEngine=ae;residentMessages=rm;
  }


  private synchronized String generateNextInvoiceCode() {
    List<Invoice> existing = invoices.findAll();
    Set<String> used = existing.stream().map(i -> i.invoiceCode).filter(Objects::nonNull).collect(Collectors.toSet());
    long seq = existing.size() + 1;
    String code = String.valueOf(seq);
    while (used.contains(code)) {
      seq++;
      code = String.valueOf(seq);
    }
    return code;
  }

  private synchronized String generateNextReadingCode() {
    List<WaterUsageLog> existing = usage.findAll();
    Set<String> used = existing.stream().map(l -> l.readingCode).filter(Objects::nonNull).collect(Collectors.toSet());
    long seq = existing.size() + 1;
    String code = "MR-" + String.format("%03d", seq);
    while (used.contains(code)) {
      seq++;
      code = "MR-" + String.format("%03d", seq);
    }
    return code;
  }

  private synchronized String generateNextCycleCode(long apartmentId) {
    List<BillingCycle> existing = billingCycles.findByApartmentId(apartmentId);
    Set<String> used = existing.stream().map(bc -> bc.cycleCode).filter(Objects::nonNull).collect(Collectors.toSet());
    long seq = existing.size() + 1;
    String code = "BC-" + String.format("%03d", seq);
    while (used.contains(code)) {
      seq++;
      code = "BC-" + String.format("%03d", seq);
    }
    return code;
  }

  private synchronized String generateNextProcurementCode() {
    List<WaterPurchase> existing = purchases.findAll();
    Set<String> used = existing.stream().map(wp -> wp.procurementCode).filter(Objects::nonNull).collect(Collectors.toSet());
    long seq = existing.size() + 1;
    String code = "PR-" + String.format("%03d", seq);
    while (used.contains(code)) {
      seq++;
      code = "PR-" + String.format("%03d", seq);
    }
    return code;
  }

  @Transactional
  public Map<String, String> resetAllData() {
    alerts.deleteAll();
    invoices.deleteAll();
    purchases.deleteAll();
    usage.deleteAll();
    billingCycles.deleteAll();
    tariffPlans.deleteAll();
    
    if(users != null) {
      List<User> userList = users.findAll();
      for(User u : userList) {
        if(u.role == Role.RESIDENT && !"resident@demo.local".equalsIgnoreCase(u.email)) {
          users.delete(u);
        }
      }
    }
    List<Household> hhList = households.findAll();
    for(Household h : hhList) {
      if(!"A-101".equalsIgnoreCase(h.flatNumber) && !"A-102".equalsIgnoreCase(h.flatNumber)) {
        households.delete(h);
      }
    }
    return Map.of("message", "All user input data has been deleted. System is now clean for new inputs!");
  }

  Apartment create(ApartmentRequest r){Apartment a=new Apartment();a.name=r.name();a.address=r.address();a.totalUnits=r.totalUnits();return apartments.save(a);}
  Apartment updateApartment(long id, ApartmentRequest r){Apartment a=apartment(id); a.name=r.name(); a.address=r.address(); a.totalUnits=r.totalUnits(); return apartments.save(a);}
  Apartment apartment(long id){return apartments.findById(id).orElseThrow(()->new NotFound("Apartment not found"));}
  Household household(long id){return households.findById(id).orElseThrow(()->new NotFound("Household not found"));}
  List<HouseholdView> getHouseholds(long apartmentId){apartment(apartmentId); return households.findByApartmentId(apartmentId).stream().map(Views::household).toList();}
  Household createHousehold(long id,HouseholdRequest r){Apartment a=apartment(id); if(households.findByApartmentIdAndFlatNumber(id,r.flatNumber()).isPresent())throw new Duplicate("Flat number already exists in apartment"); Household h=new Household();h.apartment=a;apply(h,r);return households.save(h);}
  Household updateHousehold(long id,HouseholdRequest r){Household h=household(id); apply(h,r);return households.save(h);}
  void deleteHousehold(long id){Household h=household(id); households.delete(h);}
  private void apply(Household h,HouseholdRequest r){h.flatNumber=r.flatNumber();h.flatSizeSqft=r.flatSizeSqft();h.occupancyCount=r.occupancyCount();h.hasMeter=r.hasMeter();}
  Household meter(long id,MeterRequest r){Household h=household(id);h.hasMeter=r.hasMeter();return households.save(h);}
  
  UsageView log(long householdId,UsageRequest r,UsageSource source){
    Household h=household(householdId);
    if(!h.hasMeter)throw new Invalid("Household has no configured meter");
    if(usage.existsByHouseholdIdAndReadingDate(h.id,r.readingDate()))throw new Duplicate("A reading already exists for this date");
    WaterUsageLog l=new WaterUsageLog();
    l.household=h;
    l.readingCode=generateNextReadingCode();
    l.readingDate=r.readingDate();
    l.meterReadingKl=r.meterReadingKl();
    l.source=source;
    WaterUsageLog saved = usage.save(l);
    try {
      List<BillingCycle> cList = billingCycles.findByApartmentId(h.apartment.id);
      for (BillingCycle c : cList) {
        if (!r.readingDate().isBefore(c.startsOn) && !r.readingDate().isAfter(c.endsOn)) {
          recalculateInvoiceForHousehold(h, c);
        }
      }
    } catch(Exception ignored){}
    try { alertEngine.evaluateAlerts(); } catch(Exception ignored){}
    return Views.usage(saved);
  }

  
  List<UsageView> getAllUsageLogs(){ return usage.findAll().stream().map(Views::usage).sorted(Comparator.comparing(UsageView::readingDate).reversed()).toList(); }

  @Transactional List<UsageView> csv(long apartmentId,MultipartFile f){apartment(apartmentId); if(f.isEmpty())throw new Invalid("CSV file is empty"); List<UsageView> output=new ArrayList<>(); try(BufferedReader br=new BufferedReader(new InputStreamReader(f.getInputStream(),StandardCharsets.UTF_8))){String header=br.readLine(); if(header==null||!header.trim().equalsIgnoreCase("flat_number,reading_date,meter_reading_kl"))throw new Invalid("CSV header must be flat_number,reading_date,meter_reading_kl");String line;int row=1;while((line=br.readLine())!=null){row++;final int lineNo=row;String[] p=line.split(",",-1);if(p.length!=3)throw new Invalid("Invalid CSV row "+row); Household h=households.findByApartmentIdAndFlatNumber(apartmentId,p[0].trim()).orElseThrow(()->new Invalid("Unknown flat at row "+lineNo)); try{output.add(log(h.id,new UsageRequest(LocalDate.parse(p[1].trim()),new BigDecimal(p[2].trim())),UsageSource.CSV_BULK));}catch(NumberFormatException|java.time.format.DateTimeParseException e){throw new Invalid("Invalid date or reading at row "+row);}}}catch(IOException e){throw new Invalid("Cannot read CSV file");} return output;}

  TariffPlan createPlan(long apartmentId, TariffPlanRequest r){Apartment a=apartment(apartmentId); TariffPlan p=new TariffPlan(); p.apartment=a; applyPlan(p,r); return tariffPlans.save(p);}
  TariffPlan updatePlan(long apartmentId, long planId, TariffPlanRequest r){TariffPlan p=tariffPlans.findById(planId).orElseThrow(()->new NotFound("Tariff plan not found")); applyPlan(p,r); return tariffPlans.save(p);}
  void deletePlan(long apartmentId, long planId){TariffPlan p=tariffPlans.findById(planId).orElseThrow(()->new NotFound("Tariff plan not found")); tariffPlans.delete(p);}
  private void applyPlan(TariffPlan p, TariffPlanRequest r){p.name=r.name(); p.baseThresholdKl=r.baseThresholdKl(); p.baseRate=r.baseRate(); p.excessRate=r.excessRate(); p.overuseThresholdKl=r.overuseThresholdKl(); if(r.active()!=null) p.active=r.active();}
  List<TariffPlanView> getPlans(long apartmentId){apartment(apartmentId); return tariffPlans.findByApartmentId(apartmentId).stream().map(Views::plan).toList();}

  @Transactional
  BillingCycle createCycle(long apartmentId, BillingCycleRequest r){
    Apartment a = apartment(apartmentId);
    if(r.startsOn() == null || r.endsOn() == null) {
      throw new Invalid("Start date and end date are required.");
    }
    if(r.startsOn().isAfter(r.endsOn())) {
      throw new Invalid("Start date (" + r.startsOn() + ") cannot be after end date (" + r.endsOn() + ").");
    }

    List<BillingCycle> existingCycles = billingCycles.findByApartmentId(apartmentId);

    // Rule 1: Allow ONLY ONE OPEN billing cycle at a time
    for (BillingCycle existing : existingCycles) {
      if (existing.status == CycleStatus.OPEN) {
        String openCode = (existing.cycleCode != null && !existing.cycleCode.isBlank()) ? existing.cycleCode : ("BC-" + String.format("%03d", existing.id));
        throw new Invalid("An active OPEN billing cycle (" + openCode + ") already exists. Please finalize or archive it before creating a new cycle.");
      }
    }

    // Rule 2: Prevent overlapping billing periods across existing non-archived cycles
    for (BillingCycle existing : existingCycles) {
      if (existing.status != CycleStatus.ARCHIVED) {
        boolean overlap = (!r.startsOn().isAfter(existing.endsOn)) && (!r.endsOn().isBefore(existing.startsOn));
        if (overlap) {
          String existingCode = (existing.cycleCode != null && !existing.cycleCode.isBlank()) ? existing.cycleCode : ("BC-" + String.format("%03d", existing.id));
          throw new Invalid("Billing period (" + r.startsOn() + " to " + r.endsOn() + ") overlaps with existing cycle " + existingCode + " (" + existing.startsOn + " to " + existing.endsOn + ").");
        }
      }
    }

    // Tariff Plan fallback
    TariffPlan tp = null;
    if (r.tariffPlanId() != null) {
      tp = tariffPlans.findById(r.tariffPlanId()).orElse(null);
    }
    if (tp == null) {
      List<TariffPlan> tpList = tariffPlans.findByApartmentId(apartmentId);
      if (!tpList.isEmpty()) {
        tp = tpList.get(0);
      } else {
        tp = createPlan(apartmentId, new TariffPlanRequest("Standard Tiered Rate", new BigDecimal("10"), new BigDecimal("15"), new BigDecimal("25"), new BigDecimal("20"), true));
      }
    }

    BillingCycle c = new BillingCycle();
    c.apartment = a;
    c.tariffPlan = tp;
    c.cycleCode = generateNextCycleCode(apartmentId);
    c.startsOn = r.startsOn();
    c.endsOn = r.endsOn();
    c.status = CycleStatus.OPEN;
    return billingCycles.save(c);
  }

  List<BillingCycleView> getCycles(long apartmentId){
    apartment(apartmentId);
    return billingCycles.findByApartmentIdOrderByStartsOnDesc(apartmentId).stream().map(Views::cycle).toList();
  }
  BillingCycle getCycle(long cycleId){return billingCycles.findById(cycleId).orElseThrow(()->new NotFound("Billing cycle not found"));}
  
  BillingCycle getOrCreateActiveOpenCycle() {
    List<BillingCycle> cList = billingCycles.findByApartmentIdOrderByStartsOnDesc(1L);
    for(BillingCycle c : cList) {
      if(c.status == CycleStatus.OPEN) return c;
    }
    List<TariffPlan> tpList = tariffPlans.findByApartmentId(1L);
    TariffPlan tp;
    if(tpList.isEmpty()) {
      tp = createPlan(1L, new TariffPlanRequest("Standard Tiered Rate", new BigDecimal("10"), new BigDecimal("15"), new BigDecimal("25"), new BigDecimal("20"), true));
    } else {
      tp = tpList.get(0);
    }
    return createCycle(1L, new BillingCycleRequest(tp.id, LocalDate.now().withDayOfMonth(1), LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth())));
  }

  WaterPurchase addPurchase(long cycleId, WaterPurchaseRequest r){
    BillingCycle c=getCycle(cycleId);
    if(c.status != CycleStatus.OPEN) throw new Invalid("Cannot modify purchases for a non-OPEN billing cycle");
    WaterPurchase p=new WaterPurchase();
    p.billingCycle=c;
    p.procurementCode=generateNextProcurementCode();
    applyPurchase(p,r);
    return purchases.save(p);
  }
  List<WaterPurchaseView> getPurchases(long cycleId){
    getCycle(cycleId);
    return purchases.findByBillingCycleIdOrderByPurchasedOnDesc(cycleId).stream().map(Views::purchase).toList();
  }
  List<WaterPurchaseView> getAllPurchases(){
    return purchases.findAll().stream()
      .map(Views::purchase)
      .sorted(Comparator.comparing(WaterPurchaseView::purchasedOn).reversed())
      .toList();
  }

  WaterPurchase addDirectPurchase(DirectWaterPurchaseRequest r){
    BillingCycle c;
    if(r.billingCycleId() != null) {
      c = getCycle(r.billingCycleId());
    } else {
      c = getOrCreateActiveOpenCycle();
    }
    if(c.status != CycleStatus.OPEN) throw new Invalid("Cannot modify purchases for a non-OPEN billing cycle");
    WaterPurchase p = new WaterPurchase();
    p.billingCycle = c;
    p.procurementCode = generateNextProcurementCode();
    p.source = r.source();
    p.purchasedOn = r.purchasedOn();
    p.volumeKl = r.volumeKl();
    p.unitCost = r.unitCost();
    p.notes = r.notes();
    return purchases.save(p);
  }

  WaterPurchase updatePurchase(long cycleId, long purchaseId, WaterPurchaseRequest r){
    WaterPurchase p=purchases.findById(purchaseId).orElseThrow(()->new NotFound("Purchase not found"));
    if(p.billingCycle.status != CycleStatus.OPEN) throw new Invalid("Cannot modify purchases for a non-OPEN billing cycle");
    if(p.procurementCode == null || p.procurementCode.isBlank()) {
      p.procurementCode = generateNextProcurementCode();
    }
    applyPurchase(p,r); return purchases.save(p);
  }

  WaterPurchase updateDirectPurchase(long purchaseId, DirectWaterPurchaseRequest r){
    WaterPurchase p = purchases.findById(purchaseId).orElseThrow(()->new NotFound("Purchase not found"));
    if(p.billingCycle.status != CycleStatus.OPEN) throw new Invalid("Cannot modify purchases for a non-OPEN billing cycle");
    if(p.procurementCode == null || p.procurementCode.isBlank()) {
      p.procurementCode = generateNextProcurementCode();
    }
    p.source = r.source();
    p.purchasedOn = r.purchasedOn();
    p.volumeKl = r.volumeKl();
    p.unitCost = r.unitCost();
    p.notes = r.notes();
    return purchases.save(p);
  }

  void deletePurchase(long cycleId, long purchaseId){
    WaterPurchase p=purchases.findById(purchaseId).orElseThrow(()->new NotFound("Purchase not found"));
    if(p.billingCycle.status != CycleStatus.OPEN) throw new Invalid("Cannot delete purchases for a non-OPEN billing cycle");
    purchases.delete(p);
  }

  void deleteDirectPurchase(long purchaseId){
    WaterPurchase p = purchases.findById(purchaseId).orElseThrow(()->new NotFound("Purchase not found"));
    if(p.billingCycle.status != CycleStatus.OPEN) throw new Invalid("Cannot delete purchases for a non-OPEN billing cycle");
    purchases.delete(p);
  }

  private void applyPurchase(WaterPurchase p, WaterPurchaseRequest r){p.source=r.source(); p.purchasedOn=r.purchasedOn(); p.volumeKl=r.volumeKl(); p.unitCost=r.unitCost(); p.notes=r.notes();}

  @Transactional List<InvoiceView> finalizeCycle(long cycleId){
    BillingCycle c=getCycle(cycleId);
    if(c.status == CycleStatus.ARCHIVED) throw new Invalid("Cannot finalize an ARCHIVED billing cycle");
    List<Household> hhList = households.findByApartmentId(c.apartment.id);
    TariffPlan tp = c.tariffPlan;
    List<WaterPurchase> purchaseList = purchases.findByBillingCycleId(c.id);
    
    BigDecimal totalProcurementCost = purchaseList.stream()
      .map(p -> p.volumeKl.multiply(p.unitCost))
      .reduce(BigDecimal.ZERO, BigDecimal::add);

    BigDecimal totalMeteredConsumption = BigDecimal.ZERO;
    int totalUnmeteredSqft = 0;
    Map<Long, BigDecimal> meteredConsumptionMap = new HashMap<>();

    for(Household h : hhList) {
      if(h.hasMeter) {
        List<WaterUsageLog> logs = usage.findByHouseholdIdAndReadingDateBetween(h.id, c.startsOn, c.endsOn);
        BigDecimal consumption = logs.stream().map(l -> l.meterReadingKl).reduce(BigDecimal.ZERO, BigDecimal::add);
        meteredConsumptionMap.put(h.id, consumption);
        totalMeteredConsumption = totalMeteredConsumption.add(consumption);
      } else {
        totalUnmeteredSqft += h.flatSizeSqft;
      }
    }

    List<Invoice> generated = new ArrayList<>();
    for(Household h : hhList){
      BigDecimal consumption = meteredConsumptionMap.getOrDefault(h.id, BigDecimal.ZERO);
      BigDecimal baseAmount = BigDecimal.ZERO;
      BigDecimal excessAmount = BigDecimal.ZERO;
      BigDecimal sharedAmount = BigDecimal.ZERO;

      if(h.hasMeter) {
        BigDecimal baseVol = consumption.min(tp.baseThresholdKl);
        baseAmount = baseVol.multiply(tp.baseRate);
        BigDecimal excessVol = consumption.subtract(tp.baseThresholdKl).max(BigDecimal.ZERO);
        excessAmount = excessVol.multiply(tp.excessRate);

        if(totalMeteredConsumption.compareTo(BigDecimal.ZERO) > 0 && totalProcurementCost.compareTo(BigDecimal.ZERO) > 0) {
          BigDecimal meteredRatio = consumption.divide(totalMeteredConsumption, 4, RoundingMode.HALF_UP);
          sharedAmount = totalProcurementCost.multiply(meteredRatio);
        }
      } else {
        if(totalUnmeteredSqft > 0 && totalProcurementCost.compareTo(BigDecimal.ZERO) > 0) {
          BigDecimal areaRatio = BigDecimal.valueOf(h.flatSizeSqft).divide(BigDecimal.valueOf(totalUnmeteredSqft), 4, RoundingMode.HALF_UP);
          sharedAmount = totalProcurementCost.multiply(areaRatio);
        }
      }

      BigDecimal totalAmount = baseAmount.add(excessAmount).add(sharedAmount);

      Invoice inv = new Invoice(); 
      inv.billingCycle=c; 
      inv.household=h; 
      inv.invoiceCode=generateNextInvoiceCode();
      inv.consumptionKl=consumption; 
      inv.baseAmount=baseAmount.setScale(2, RoundingMode.HALF_UP);
      inv.excessAmount=excessAmount.setScale(2, RoundingMode.HALF_UP);
      inv.sharedAmount=sharedAmount.setScale(2, RoundingMode.HALF_UP);
      inv.totalAmount=totalAmount.setScale(2, RoundingMode.HALF_UP);
      inv.status="UNPAID";
      generated.add(invoices.save(inv));
    }
    c.status = CycleStatus.FINALIZED; billingCycles.save(c);
    return generated.stream().map(Views::invoice).toList();
  }

  private void recalculateInvoiceForHousehold(Household h, BillingCycle c) {
    if (h == null || c == null) return;
    TariffPlan tp = c.tariffPlan;
    if (tp == null) {
      List<TariffPlan> tpList = tariffPlans.findByApartmentId(c.apartment.id);
      if (!tpList.isEmpty()) tp = tpList.get(0);
      else return;
    }

    List<WaterUsageLog> logs = usage.findByHouseholdIdAndReadingDateBetween(h.id, c.startsOn, c.endsOn);
    BigDecimal consumption = logs.stream().map(l -> l.meterReadingKl).reduce(BigDecimal.ZERO, BigDecimal::add);

    BigDecimal baseAmount = BigDecimal.ZERO;
    BigDecimal excessAmount = BigDecimal.ZERO;
    BigDecimal sharedAmount = BigDecimal.ZERO;

    if (h.hasMeter) {
      BigDecimal baseVol = consumption.min(tp.baseThresholdKl);
      baseAmount = baseVol.multiply(tp.baseRate);
      BigDecimal excessVol = consumption.subtract(tp.baseThresholdKl).max(BigDecimal.ZERO);
      excessAmount = excessVol.multiply(tp.excessRate);

      List<WaterPurchase> purchaseList = purchases.findByBillingCycleId(c.id);
      BigDecimal totalProcurementCost = purchaseList.stream()
        .map(p -> p.volumeKl.multiply(p.unitCost))
        .reduce(BigDecimal.ZERO, BigDecimal::add);

      if (totalProcurementCost.compareTo(BigDecimal.ZERO) > 0) {
        List<Household> hhList = households.findByApartmentId(c.apartment.id);
        BigDecimal totalMeteredConsumption = BigDecimal.ZERO;
        for (Household other : hhList) {
          if (other.hasMeter) {
            List<WaterUsageLog> oLogs = usage.findByHouseholdIdAndReadingDateBetween(other.id, c.startsOn, c.endsOn);
            totalMeteredConsumption = totalMeteredConsumption.add(oLogs.stream().map(l -> l.meterReadingKl).reduce(BigDecimal.ZERO, BigDecimal::add));
          }
        }
        if (totalMeteredConsumption.compareTo(BigDecimal.ZERO) > 0) {
          BigDecimal meteredRatio = consumption.divide(totalMeteredConsumption, 4, RoundingMode.HALF_UP);
          sharedAmount = totalProcurementCost.multiply(meteredRatio);
        }
      }
    }

    BigDecimal totalAmount = baseAmount.add(excessAmount).add(sharedAmount);

    Optional<Invoice> existingInv = invoices.findByBillingCycleId(c.id).stream()
      .filter(i -> i.household != null && i.household.id.equals(h.id))
      .findFirst();

    Invoice inv;
    if (existingInv.isPresent()) {
      inv = existingInv.get();
    } else {
      inv = new Invoice();
      inv.billingCycle = c;
      inv.household = h;
      inv.invoiceCode = generateNextInvoiceCode();
      inv.status = "UNPAID";
    }
    inv.consumptionKl = consumption;
    inv.baseAmount = baseAmount.setScale(2, RoundingMode.HALF_UP);
    inv.excessAmount = excessAmount.setScale(2, RoundingMode.HALF_UP);
    inv.sharedAmount = sharedAmount.setScale(2, RoundingMode.HALF_UP);
    inv.totalAmount = totalAmount.setScale(2, RoundingMode.HALF_UP);
    invoices.save(inv);
  }

  private void syncMissingInvoicesForLoggedUsage() {
    List<WaterUsageLog> allLogs = usage.findAll();
    for (WaterUsageLog l : allLogs) {
      if (l.household == null) continue;
      List<BillingCycle> cycles = billingCycles.findByApartmentId(l.household.apartment.id);
      for (BillingCycle c : cycles) {
        if (!l.readingDate.isBefore(c.startsOn) && !l.readingDate.isAfter(c.endsOn)) {
          recalculateInvoiceForHousehold(l.household, c);
        }
      }
    }
  }

  List<InvoiceView> getInvoices(long cycleId){
    BillingCycle c = getCycle(cycleId);
    syncMissingInvoicesForLoggedUsage();
    return invoices.findByBillingCycleIdOrderByIdDesc(cycleId).stream().map(Views::invoice).toList();
  }
  List<InvoiceView> getAllInvoices(){
    syncMissingInvoicesForLoggedUsage();
    return invoices.findAll().stream().map(Views::invoice).sorted(Comparator.comparing(InvoiceView::id).reversed()).toList();
  }
  Invoice markInvoicePaid(long invoiceId){
    Invoice inv = invoices.findById(invoiceId).orElseThrow(()->new NotFound("Invoice not found"));
    inv.status="PAID";
    if (inv.paymentMethod == null || inv.paymentMethod.isBlank()) inv.paymentMethod = "ADMIN_VERIFIED";
    if (inv.transactionRef == null || inv.transactionRef.isBlank()) inv.transactionRef = "ADM-" + (System.currentTimeMillis() % 1000000);
    if (inv.paidAt == null) inv.paidAt = Instant.now();
    return invoices.save(inv);
  }
  BillingCycle archiveCycle(long cycleId){BillingCycle c=getCycle(cycleId); c.status=CycleStatus.ARCHIVED; return billingCycles.save(c);}
  List<AlertView> getAlerts(){return alerts.findAllByOrderByIdDesc().stream().map(Views::alert).toList();}
  Alert markAlertResolved(long alertId){Alert a = alerts.findById(alertId).orElseThrow(()->new NotFound("Alert not found")); a.resolved=true; return alerts.save(a);}
  
  Alert sendAdminMessage(AdminMessageRequest r) {
    Apartment a = apartment(1L);
    Household h = null;
    if (r.householdId() != null) {
      h = household(r.householdId());
    } else if (r.flatNumber() != null && !r.flatNumber().isBlank() && !"ALL".equalsIgnoreCase(r.flatNumber())) {
      h = households.findByApartmentIdAndFlatNumber(1L, r.flatNumber().trim().toUpperCase()).orElse(null);
    }
    String alertType = (r.category() != null && !r.category().isBlank()) ? r.category().trim().toUpperCase() : "DIRECT_MESSAGE";
    Alert alt = new Alert();
    alt.apartment = a;
    alt.household = h;
    alt.type = alertType;
    alt.message = r.message().trim();
    return alerts.save(alt);
  }

  DashboardSummary getDashboardSummary(long apartmentId) {
    List<Household> hList = households.findByApartmentId(apartmentId);
    long metered = hList.stream().filter(h -> h.hasMeter).count();
    long unmetered = hList.size() - metered;

    List<BillingCycle> cyclesList = billingCycles.findByApartmentIdOrderByStartsOnDesc(apartmentId);
    String activeStatus = cyclesList.isEmpty() ? "NONE" : cyclesList.get(0).status.name();

    BigDecimal totalPurchased = purchases.findAll().stream().map(p -> p.volumeKl).reduce(BigDecimal.ZERO, BigDecimal::add);
    BigDecimal totalConsumed = invoices.findAll().stream().map(i -> i.consumptionKl).reduce(BigDecimal.ZERO, BigDecimal::add);
    BigDecimal totalRev = invoices.findAll().stream().map(i -> i.totalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

    long pending = invoices.findAll().stream().filter(i -> "UNPAID".equalsIgnoreCase(i.status)).count();
    long paid = invoices.findAll().stream().filter(i -> "PAID".equalsIgnoreCase(i.status)).count();
    long leakCount = alerts.findAll().stream().filter(a -> !a.resolved).count();

    return new DashboardSummary(
      hList.size(), metered, unmetered, activeStatus, totalPurchased, totalConsumed, totalRev, pending, paid, leakCount
    );
  }

  BenchmarkView getBenchmark(long householdId) {
    Household h = household(householdId);
    List<WaterUsageLog> myLogs = usage.findByHouseholdIdOrderByReadingDateAsc(h.id);
    BigDecimal myVol = myLogs.stream().map(l -> l.meterReadingKl).reduce(BigDecimal.ZERO, BigDecimal::add);

    List<Household> allFlats = households.findByApartmentId(h.apartment.id);
    Map<Long, BigDecimal> flatVols = new HashMap<>();
    for(Household f : allFlats) {
      List<WaterUsageLog> logs = usage.findByHouseholdIdOrderByReadingDateAsc(f.id);
      BigDecimal sum = logs.stream().map(l -> l.meterReadingKl).reduce(BigDecimal.ZERO, BigDecimal::add);
      flatVols.put(f.id, sum);
    }

    double totalVolSum = flatVols.values().stream().mapToDouble(BigDecimal::doubleValue).sum();
    double aptAvg = allFlats.isEmpty() ? 0.0 : totalVolSum / allFlats.size();

    List<Household> similarFlats = allFlats.stream()
      .filter(f -> Math.abs(f.flatSizeSqft - h.flatSizeSqft) <= 300)
      .toList();
    double similarSum = similarFlats.stream().mapToDouble(f -> flatVols.getOrDefault(f.id, BigDecimal.ZERO).doubleValue()).sum();
    double simAvg = similarFlats.isEmpty() ? aptAvg : similarSum / similarFlats.size();

    int rank = 1;
    for(BigDecimal v : flatVols.values()) {
      if(v.compareTo(myVol) > 0) rank++;
    }

    String badge = "⭐ Top 25% Water Saver";
    if(myVol.doubleValue() > aptAvg && aptAvg > 0) {
      badge = "⚠️ High Usage Alert - " + Math.round(((myVol.doubleValue() - aptAvg)/aptAvg)*100) + "% Above Average";
    } else if(myVol.doubleValue() < aptAvg && aptAvg > 0) {
      badge = "🌿 " + Math.round(((aptAvg - myVol.doubleValue())/aptAvg)*100) + "% Below Apartment Average!";
    }

    return new BenchmarkView(
      h.id,
      h.flatNumber,
      myVol,
      BigDecimal.valueOf(aptAvg).setScale(2, RoundingMode.HALF_UP),
      BigDecimal.valueOf(simAvg).setScale(2, RoundingMode.HALF_UP),
      rank,
      badge
    );
  }

  Invoice payInvoice(long invoiceId, PaymentRequest r) {
    Invoice inv = invoices.findById(invoiceId).orElseThrow(() -> new NotFound("Invoice not found"));
    inv.status = "PENDING_VERIFICATION";
    inv.paymentMethod = (r != null && r.paymentMethod() != null && !r.paymentMethod().isBlank()) ? r.paymentMethod() : "UPI";
    inv.transactionRef = (r != null && r.transactionRef() != null && !r.transactionRef().isBlank()) ? r.transactionRef() : "TXN-" + System.currentTimeMillis();
    inv.paidAt = Instant.now();
    return invoices.save(inv);
  }

  ResidentMessage sendResidentMessage(User user, ResidentMessageReq r) {
    ResidentMessage msg = new ResidentMessage();
    msg.user = user;
    msg.household = user.household;
    msg.flatNumber = user.household != null ? user.household.flatNumber : "N/A";
    msg.residentName = user.name != null && !user.name.isBlank() ? user.name : user.email;
    msg.subject = r.subject() != null && !r.subject().isBlank() ? r.subject().trim() : "General Enquiry";
    msg.message = r.message().trim();
    msg.status = "UNREAD";
    return residentMessages.save(msg);
  }

  List<ResidentMessageView> listResidentMessages() {
    return residentMessages != null ? residentMessages.findAllByOrderByIdDesc().stream().map(Views::residentMessage).toList() : List.of();
  }

  List<ResidentMessageView> listMyResidentMessages(Long householdId) {
    if (householdId == null || residentMessages == null) return List.of();
    return residentMessages.findByHouseholdIdOrderByIdDesc(householdId).stream().map(Views::residentMessage).toList();
  }

  ResidentMessage markResidentMessageRead(long id) {
    ResidentMessage msg = residentMessages.findById(id).orElseThrow(() -> new NotFound("Message not found"));
    msg.status = "READ";
    return residentMessages.save(msg);
  }
}

@Service class PdfInvoiceService {
  final InvoiceRepo invoices;
  PdfInvoiceService(InvoiceRepo i) { this.invoices = i; }

  public byte[] generateInvoicePdf(long invoiceId) throws IOException {
    Invoice inv = invoices.findById(invoiceId).orElseThrow(() -> new NotFound("Invoice not found"));
    Household h = inv.household;
    BillingCycle c = inv.billingCycle;

    try (PDDocument doc = new PDDocument()) {
      PDPage page = new PDPage();
      doc.addPage(page);

      try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
        cs.beginText();
        cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 20);
        cs.newLineAtOffset(50, 750);
        cs.showText("SMART WATER UTILITY BILLING");
        cs.endText();

        cs.beginText();
        cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
        cs.newLineAtOffset(50, 735);
        cs.showText("Official Household Water Consumption Invoice");
        cs.endText();

        cs.setLineWidth(1.5f);
        cs.moveTo(50, 725);
        cs.lineTo(550, 725);
        cs.stroke();

        String displayCode = inv.invoiceCode != null ? "id " + inv.invoiceCode : "id " + inv.id;
        String cycleCode = c.cycleCode != null ? c.cycleCode : "BC-" + c.id;

        cs.beginText();
        cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 12);
        cs.newLineAtOffset(50, 695);
        cs.showText("INVOICE SUMMARY");
        cs.endText();

        int y = 675;
        cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 11);

        writeLine(cs, 50, y, "Invoice Number: " + displayCode); y -= 20;
        writeLine(cs, 50, y, "Billing Cycle: " + cycleCode + " (" + c.startsOn + " to " + c.endsOn + ")"); y -= 20;
        writeLine(cs, 50, y, "Flat Number: Flat " + h.flatNumber); y -= 20;
        writeLine(cs, 50, y, "Flat Size: " + h.flatSizeSqft + " sq.ft | Occupancy: " + h.occupancyCount + " residents"); y -= 30;

        cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 12);
        writeLine(cs, 50, y, "ITEMIZED CHARGES BREAKDOWN"); y -= 20;

        cs.setLineWidth(1f);
        cs.moveTo(50, y + 5);
        cs.lineTo(550, y + 5);
        cs.stroke();

        cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 11);
        writeLine(cs, 50, y, "Metered Consumption: " + inv.consumptionKl + " kL"); y -= 20;
        writeLine(cs, 50, y, "Base Tier Amount (Rs.15/kL): Rs. " + inv.baseAmount); y -= 20;
        writeLine(cs, 50, y, "Excess Tier Amount (Rs.25/kL): Rs. " + inv.excessAmount); y -= 20;
        writeLine(cs, 50, y, "Shared Tanker Cost: Rs. " + inv.sharedAmount); y -= 25;

        cs.moveTo(50, y + 5);
        cs.lineTo(550, y + 5);
        cs.stroke();

        y -= 10;
        cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 14);
        writeLine(cs, 50, y, "TOTAL AMOUNT DUE: Rs. " + inv.totalAmount); y -= 25;

        cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 11);
        writeLine(cs, 50, y, "PAYMENT STATUS: " + inv.status); y -= 40;

        cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 11);
        writeLine(cs, 50, y, "PAYMENT INSTRUCTIONS & NEFT/UPI DETAILS:"); y -= 20;

        cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
        writeLine(cs, 50, y, "Bank Name: State Bank of India | Account: 382910293810"); y -= 16;
        writeLine(cs, 50, y, "IFSC Code: SBIN0004921 | UPI ID: smartwater@sbi"); y -= 16;
        writeLine(cs, 50, y, "Please mention Invoice " + displayCode + " in payment remarks.");
      }

      ByteArrayOutputStream baos = new ByteArrayOutputStream();
      doc.save(baos);
      return baos.toByteArray();
    }
  }

  private void writeLine(PDPageContentStream cs, float x, float y, String text) throws IOException {
    cs.beginText();
    cs.newLineAtOffset(x, y);
    cs.showText(text);
    cs.endText();
  }
}


@Service class TransactionalEmailService {
  private static final Logger log = LoggerFactory.getLogger(TransactionalEmailService.class);

  @org.springframework.beans.factory.annotation.Autowired(required = false)
  private org.springframework.mail.javamail.JavaMailSender mailSender;

  public void sendMonthlyBillNotification(String toEmail, String flatNumber, String invoiceCode, BigDecimal totalAmount, String pdfFileName, byte[] pdfContent) {
    String subject = "SmartWater Invoice " + invoiceCode + " - Flat " + flatNumber;
    String body = "Dear Resident,\n\nYour monthly water bill for Flat " + flatNumber + " is ready.\nTotal Amount Due: ₹" + totalAmount + "\n\nPlease find attached your itemized PDF invoice.\n\nThank you,\nSmartWater Management";

    if (mailSender != null) {
      try {
        jakarta.mail.internet.MimeMessage message = mailSender.createMimeMessage();
        org.springframework.mail.javamail.MimeMessageHelper helper = new org.springframework.mail.javamail.MimeMessageHelper(message, true);
        helper.setTo(toEmail);
        helper.setSubject(subject);
        helper.setText(body);
        if (pdfContent != null && pdfContent.length > 0) {
          helper.addAttachment(pdfFileName != null ? pdfFileName : "Invoice.pdf", new org.springframework.core.io.ByteArrayResource(pdfContent));
        }
        mailSender.send(message);
        log.info("[JAVAMAIL DISPATCH SUCCESS] Monthly bill email sent to {}", toEmail);
      } catch (Exception e) {
        log.warn("[JAVAMAIL DISPATCH WARNING] Could not send email via JavaMailSender: {}. Fallback to transactional log.", e.getMessage());
      }
    } else {
      log.info("[TRANSACTIONAL EMAIL LOG] Monthly Bill Notification -> To: {}, Flat: {}, Invoice: {}, Amount: ₹{}", toEmail, flatNumber, invoiceCode, totalAmount);
    }
  }

  public void sendOveruseAlert(String toEmail, String flatNumber, String message, List<String> tips) {
    String subject = "⚠️ Water Overuse Alert - Flat " + flatNumber;
    StringBuilder body = new StringBuilder();
    body.append("Dear Resident of Flat ").append(flatNumber).append(",\n\n");
    body.append(message).append("\n\nWater-Saving Tips to Reduce Your Usage:\n");
    for (String tip : tips) {
      body.append("• ").append(tip).append("\n");
    }
    body.append("\nThank you,\nSmartWater Conservation Team");

    if (mailSender != null) {
      try {
        jakarta.mail.internet.MimeMessage mime = mailSender.createMimeMessage();
        org.springframework.mail.javamail.MimeMessageHelper helper = new org.springframework.mail.javamail.MimeMessageHelper(mime, false);
        helper.setTo(toEmail);
        helper.setSubject(subject);
        helper.setText(body.toString());
        mailSender.send(mime);
        log.info("[JAVAMAIL DISPATCH SUCCESS] Overuse alert email sent to {}", toEmail);
      } catch (Exception e) {
        log.warn("[JAVAMAIL DISPATCH WARNING] Could not send overuse alert via JavaMailSender: {}", e.getMessage());
      }
    } else {
      log.info("[TRANSACTIONAL EMAIL LOG] Overuse Alert -> To: {}, Flat: {}, Message: {}", toEmail, flatNumber, message);
    }
  }

  public void sendAnomalyReportToAdmin(String adminEmail, String flatNumber, String anomalyMessage) {
    String subject = "🚨 Water Anomaly / Leak Detection Report - Flat " + flatNumber;
    String body = "Dear Apartment Admin,\n\nAn automated anomaly detection scan identified a potential issue:\n" + anomalyMessage + "\n\nPlease inspect the meter log and flat pipeline.\n\nSmartWater System";

    if (mailSender != null) {
      try {
        jakarta.mail.internet.MimeMessage mime = mailSender.createMimeMessage();
        org.springframework.mail.javamail.MimeMessageHelper helper = new org.springframework.mail.javamail.MimeMessageHelper(mime, false);
        helper.setTo(adminEmail);
        helper.setSubject(subject);
        helper.setText(body);
        mailSender.send(mime);
        log.info("[JAVAMAIL DISPATCH SUCCESS] Anomaly report sent to admin: {}", adminEmail);
      } catch (Exception e) {
        log.warn("[JAVAMAIL DISPATCH WARNING] Could not send admin anomaly report via JavaMailSender: {}", e.getMessage());
      }
    } else {
      log.info("[TRANSACTIONAL EMAIL LOG] Anomaly Report to Admin -> To: {}, Flat: {}, Anomaly: {}", adminEmail, flatNumber, anomalyMessage);
    }
  }
}


@Service class AlertEngineService {
  private static final Logger log = LoggerFactory.getLogger(AlertEngineService.class);
  final HouseholdRepo households; final UsageRepo usage; final TariffPlanRepo tariffPlans; final AlertRepo alerts; final TransactionalEmailService emailService;
  private Instant lastEvaluatedAt = Instant.now();
  private int lastEvaluatedCount = 0;

  AlertEngineService(HouseholdRepo h, UsageRepo u, TariffPlanRepo tp, AlertRepo a, TransactionalEmailService emailService){
    households=h; usage=u; tariffPlans=tp; alerts=a; this.emailService = emailService;
  }

  @Scheduled(fixedDelay = 60000)
  public AlertAuditResult evaluateAlerts() {
    List<Household> allHouseholds = households.findAll();
    lastEvaluatedCount = allHouseholds.size();
    lastEvaluatedAt = Instant.now();

    List<String> waterSavingTips = List.of(
      "Fix silent toilet flapper leaks (saves up to 200 L/day)",
      "Install low-flow tap aerators to reduce flow rate by 40%",
      "Use bucket baths instead of continuous 10-minute showers",
      "Run washing machines with full laundry loads only"
    );

    for(Household h : allHouseholds) {
      List<WaterUsageLog> logs = usage.findByHouseholdIdOrderByReadingDateAsc(h.id);
      if(logs.isEmpty()) continue;

      List<TariffPlan> plans = tariffPlans.findByApartmentId(h.apartment.id);
      if(!plans.isEmpty()) {
        TariffPlan tp = plans.get(0);
        BigDecimal totalRecent = logs.stream().map(l -> l.meterReadingKl).reduce(BigDecimal.ZERO, BigDecimal::add);
        if(totalRecent.compareTo(tp.overuseThresholdKl) > 0) {
          String msg = "Flat " + h.flatNumber + " exceeded overuse threshold of " + tp.overuseThresholdKl + " kL (Total: " + totalRecent + " kL)";
          if(!alerts.existsByHouseholdIdAndTypeAndMessage(h.id, "OVERUSE", msg)) {
            Alert alt = new Alert(); alt.apartment = h.apartment; alt.household = h; alt.type = "OVERUSE"; alt.message = msg; alerts.save(alt);
            log.info("[EMAIL NOTIFICATION DISPATCHED] Overuse Alert sent for Flat {}: {}", h.flatNumber, msg);
            emailService.sendOveruseAlert("flat" + h.flatNumber.toLowerCase() + "@apartment.com", h.flatNumber, msg, waterSavingTips);
          }
        }
      }

      if(logs.size() >= 3) {
        double[] readings = logs.stream().mapToDouble(l -> l.meterReadingKl.doubleValue()).toArray();
        double sum = 0; for(double d : readings) sum += d;
        double mean = sum / readings.length;
        double variance = 0; for(double d : readings) variance += Math.pow(d - mean, 2);
        double stdDev = Math.sqrt(variance / readings.length);

        double latest = readings[readings.length - 1];
        if(latest > (mean + 2 * stdDev) && stdDev > 0.1) {
          String msg = "Potential leak spike detected in Flat " + h.flatNumber + ": latest reading (" + latest + " kL) > 2σ above mean (" + String.format("%.2f", mean) + " kL)";
          if(!alerts.existsByHouseholdIdAndTypeAndMessage(h.id, "LEAK_SPIKE", msg)) {
            Alert alt = new Alert(); alt.apartment = h.apartment; alt.household = h; alt.type = "LEAK_SPIKE"; alt.message = msg; alerts.save(alt);
            log.info("[EMAIL NOTIFICATION DISPATCHED] Statistical 2σ Leak Anomaly Alert sent for Flat {}: {}", h.flatNumber, msg);
            emailService.sendAnomalyReportToAdmin("admin@apartment.com", h.flatNumber, msg);
          }
        }
      }
    }
    List<AlertView> alertList = alerts.findAllByOrderByIdDesc().stream().map(Views::alert).toList();
    return new AlertAuditResult(lastEvaluatedAt.toString(), lastEvaluatedCount, alertList.size(), alertList);
  }
}

@Service class AuthService {
  final UserRepo users;final ApartmentRepo apartments;final HouseholdRepo households;final PasswordEncoder encoder;final Jwt jwt;
  AuthService(UserRepo u,ApartmentRepo a,HouseholdRepo h,PasswordEncoder e,Jwt j){users=u;apartments=a;households=h;encoder=e;jwt=j;}
  User register(RegisterRequest r){
    if (r.role() != Role.RESIDENT) throw new Invalid("Public registration is available only for residents");
    Optional<User> existing = users.findByEmailIgnoreCase(r.email());
    if(existing.isPresent()) {
      User ex = existing.get();
      if("REJECTED".equalsIgnoreCase(ex.status)) {
        users.delete(ex);
      } else {
        throw new Duplicate("Email already registered");
      }
    }
    Apartment a = (r.apartmentId() != null) ? apartments.findById(r.apartmentId()).orElse(null) : null;
    if(a == null) {
      List<Apartment> aList = apartments.findAll();
      if(!aList.isEmpty()) a = aList.get(0);
      else {
        Apartment newA = new Apartment(); newA.name = "SmartWater Apartment"; newA.address = "Main Street"; newA.totalUnits = 50; a = apartments.save(newA);
      }
    }
    Household h = null;
    String targetFlat = r.flatNumber();
    if(r.householdId() != null) {
      h = households.findById(r.householdId()).orElse(null);
    }
    int occ = (r.occupancyCount() != null && r.occupancyCount() > 0) ? r.occupancyCount() : 3;
    int sqft = (r.flatSizeSqft() != null && r.flatSizeSqft() > 0) ? r.flatSizeSqft() : 1200;
    if(targetFlat != null && !targetFlat.isBlank()) {
      String fNum = targetFlat.trim().toUpperCase();
      Optional<Household> existingH = households.findByApartmentIdAndFlatNumber(a.id, fNum);
      if(existingH.isPresent()) {
        h = existingH.get();
        h.occupancyCount = occ;
        h.flatSizeSqft = sqft;
        h = households.save(h);
      } else {
        Household newH = new Household();
        newH.apartment = a;
        newH.flatNumber = fNum;
        newH.flatSizeSqft = sqft;
        newH.occupancyCount = occ;
        newH.hasMeter = true;
        h = households.save(newH);
      }
    }
    if(r.role() == Role.RESIDENT && h == null) {
      List<Household> hhList = households.findByApartmentId(a.id);
      if(!hhList.isEmpty()) h = hhList.get(0);
      else throw new Invalid("Flat number is required for Resident registration.");
    }
    // Accounts created here are always created by an authenticated Community Admin
    // (see AuthController.register's @PreAuthorize), so they're pre-vetted and
    // approved immediately — no separate approval step needed.
    String userStatus = "APPROVED";
    User u = new User();
    u.apartment = a;
    u.household = h;
    u.name = (r.name() != null && !r.name().isBlank()) ? r.name().trim() : null;
    u.email = r.email().toLowerCase().trim();
    u.passwordHash = encoder.encode(r.password());
    u.role = r.role();
    u.status = userStatus;
    return users.save(u);
  }
  AuthResponse login(LoginRequest r){
    User u = users.findByEmailIgnoreCase(r.email()).orElseThrow(()->new Unauthorized());
    if(!encoder.matches(r.password(),u.passwordHash)) throw new Unauthorized();
    if("PENDING".equalsIgnoreCase(u.status)) throw new Invalid("Your account registration is pending approval by the Administrator.");
    if("REJECTED".equalsIgnoreCase(u.status)) throw new Invalid("Your account registration was rejected by the Administrator.");
    return new AuthResponse(jwt.access(u),jwt.refresh(u),Views.user(u));
  }
  User approveUser(long userId) {
    User u = users.findById(userId).orElseThrow(() -> new NotFound("User not found"));
    u.status = "APPROVED";
    if (u.household != null) {
      u.household.hasMeter = true;
      households.save(u.household);
    }
    return users.save(u);
  }
  User rejectUser(long userId) {
    User u = users.findById(userId).orElseThrow(() -> new NotFound("User not found"));
    Household h = u.household;
    users.delete(u);
    if (h != null) {
      long remaining = users.findAll().stream().filter(other -> other.household != null && other.household.id.equals(h.id)).count();
      if (remaining == 0) {
        try {
          households.delete(h);
        } catch (Exception ignored) {}
      }
    }
    return u;
  }
  List<UserView> listPendingUsers() {
    return users.findAll().stream().filter(u -> "PENDING".equalsIgnoreCase(u.status)).map(Views::user).toList();
  }

  User me(String email){return users.findByEmailIgnoreCase(email).orElseThrow(Unauthorized::new);}
  User update(String email,UserUpdateRequest r){
    User u=me(email);
    if(r.name()!=null && !r.name().isBlank()) {
      u.name = r.name().trim();
    }
    if(r.email()!=null && !r.email().isBlank() && !u.email.equalsIgnoreCase(r.email())) {
      if(users.existsByEmailIgnoreCase(r.email()))throw new Duplicate("Email already registered");
      u.email = r.email().toLowerCase().trim();
    }
    if(r.flatNumber()!=null && !r.flatNumber().isBlank()) {
      String fNum = r.flatNumber().trim().toUpperCase();
      Optional<Household> existingH = households.findByApartmentIdAndFlatNumber(u.apartment.id, fNum);
      if(existingH.isPresent()) {
        u.household = existingH.get();
      } else {
        Household newH = new Household();
        newH.apartment = u.apartment;
        newH.flatNumber = fNum;
        newH.flatSizeSqft = 1200;
        newH.occupancyCount = 3;
        newH.hasMeter = true;
        u.household = households.save(newH);
      }
    }
    return users.save(u);
  }
  List<UserView> listAll(){return users.findAll().stream().map(Views::user).toList();}
  User createCommunityAdmin(long apartmentId, RegisterRequest r) {
    if (r.role() != Role.COMMUNITY_ADMIN) throw new Invalid("Role must be COMMUNITY_ADMIN");
    if (users.existsByEmailIgnoreCase(r.email())) throw new Duplicate("Email already registered");
    Apartment apartment = apartments.findById(apartmentId).orElseThrow(() -> new NotFound("Apartment not found"));
    User user = new User(); user.apartment = apartment; user.name = r.name(); user.email = r.email().toLowerCase().trim();
    user.passwordHash = encoder.encode(r.password()); user.role = Role.COMMUNITY_ADMIN; user.status = "APPROVED";
    return users.save(user);
  }
  User createSuperAdmin(String name, String email, String password) {
    if (users.existsByEmailIgnoreCase(email)) throw new Duplicate("Email already registered");
    User user = new User(); user.name = name; user.email = email.toLowerCase().trim(); user.passwordHash = encoder.encode(password);
    user.role = Role.SUPER_ADMIN; user.status = "APPROVED"; return users.save(user);
  }
}


@Component class Jwt {
  final Key key;final long accessMinutes,refreshDays;
  Jwt(@Value("${app.jwt.secret}")String secret,@Value("${app.jwt.access-minutes}")long access,@Value("${app.jwt.refresh-days}")long refresh){key=Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));accessMinutes=access;refreshDays=refresh;}
  String access(User u){return make(u,Duration.ofMinutes(accessMinutes),"access");}String refresh(User u){return make(u,Duration.ofDays(refreshDays),"refresh");}
  String make(User u,Duration d,String type){return Jwts.builder().subject(u.email).claim("role",u.role.name()).claim("apartmentId",u.apartment == null ? null : u.apartment.id).claim("type",type).issuedAt(new Date()).expiration(Date.from(Instant.now().plus(d))).signWith(key).compact();}
  Claims parse(String s){return Jwts.parser().verifyWith((javax.crypto.SecretKey)key).build().parseSignedClaims(s).getPayload();}
}
@Component class JwtFilter extends OncePerRequestFilter {
  final Jwt jwt;JwtFilter(Jwt j){jwt=j;}
  @Override protected void doFilterInternal(HttpServletRequest r,HttpServletResponse s,FilterChain c)throws IOException,ServletException{
    String h=r.getHeader("Authorization");
    if(h!=null&&h.startsWith("Bearer "))try{Claims cl=jwt.parse(h.substring(7));String role=cl.get("role",String.class);var auth=new UsernamePasswordAuthenticationToken(cl.getSubject(),null,List.of(new SimpleGrantedAuthority("ROLE_"+role)));SecurityContextHolder.getContext().setAuthentication(auth);}catch(Exception ignored){}
    c.doFilter(r,s);
  }
}
@Configuration @EnableWebSecurity @EnableMethodSecurity class SecurityConfig {
  final JwtFilter filter;SecurityConfig(JwtFilter f){filter=f;}
  @Bean PasswordEncoder passwordEncoder(){return new BCryptPasswordEncoder();}
  @Bean SecurityFilterChain chain(HttpSecurity h)throws Exception{
    return h.cors(c->c.configurationSource(corsSource()))
      .csrf(c->c.disable())
      .httpBasic(b->b.disable())
      .formLogin(f->f.disable())
      .headers(hd->hd.frameOptions(fo->fo.sameOrigin()))
      .sessionManagement(s->s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
      .authorizeHttpRequests(a->a
        .requestMatchers("/api/auth/login","/swagger-ui.html","/swagger-ui/**","/v3/api-docs/**","/v3/api-docs","/swagger-resources/**","/webjars/**","/h2-console/**").permitAll()
        .requestMatchers("/api/super-admin/**").hasRole("SUPER_ADMIN")
        .requestMatchers("/admin/**","/billing/**","/tariff/**","/procurement/**","/households/**","/alerts/admin/**","/invoice/admin/**","/meter/admin/**","/api/admin/**","/api/procurements/**").hasAnyRole("SUPER_ADMIN", "COMMUNITY_ADMIN")
        .requestMatchers("/resident/**","/profile/**","/my-usage/**","/my-bills/**","/my-invoices/**","/my-alerts/**","/notifications/**","/api/resident/**").hasRole("RESIDENT")
        .anyRequest().authenticated()
      )
      .addFilterBefore(filter,UsernamePasswordAuthenticationFilter.class).build();
  }
  @Bean CorsConfigurationSource corsSource(){
    CorsConfiguration c = new CorsConfiguration();
    c.setAllowedOriginPatterns(List.of("*"));
    c.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS"));
    c.setAllowedHeaders(List.of("*"));
    c.setAllowCredentials(true);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", c);
    return source;
  }
}

class NotFound extends RuntimeException{NotFound(String m){super(m);}}class Duplicate extends RuntimeException{Duplicate(String m){super(m);}}class Invalid extends RuntimeException{Invalid(String m){super(m);}}class Unauthorized extends RuntimeException{Unauthorized(){super("Invalid email or password");}}

/** Central authorization boundary for tenant-owned resources.  Super admins bypass it; community admins must match the resource apartment. */
@Component("tenantAccess") class TenantAccess {
  final UserRepo users; final ApartmentRepo apartments; final HouseholdRepo households; final BillingCycleRepo cycles; final WaterPurchaseRepo purchases; final InvoiceRepo invoices; final AlertRepo alerts; final ResidentMessageRepo messages;
  TenantAccess(UserRepo u, ApartmentRepo a, HouseholdRepo h, BillingCycleRepo c, WaterPurchaseRepo p, InvoiceRepo i, AlertRepo al, ResidentMessageRepo m){users=u;apartments=a;households=h;cycles=c;purchases=p;invoices=i;alerts=al;messages=m;}
  boolean apartment(Authentication auth, long apartmentId){ return allowed(auth, apartmentId); }
  boolean household(Authentication auth, long householdId){ return allowed(auth, households.findById(householdId).orElseThrow(()->new NotFound("Household not found")).apartment.id); }
  boolean cycle(Authentication auth, long cycleId){ return allowed(auth, cycles.findById(cycleId).orElseThrow(()->new NotFound("Billing cycle not found")).apartment.id); }
  boolean purchase(Authentication auth, long purchaseId){ return allowed(auth, purchases.findById(purchaseId).orElseThrow(()->new NotFound("Purchase not found")).billingCycle.apartment.id); }
  boolean invoice(Authentication auth, long invoiceId){ return allowed(auth, invoices.findById(invoiceId).orElseThrow(()->new NotFound("Invoice not found")).billingCycle.apartment.id); }
  boolean alert(Authentication auth, long alertId){ Alert a=alerts.findById(alertId).orElseThrow(()->new NotFound("Alert not found")); return allowed(auth, a.apartment.id); }
  boolean message(Authentication auth, long messageId){ ResidentMessage m=messages.findById(messageId).orElseThrow(()->new NotFound("Message not found")); return allowed(auth, m.household.apartment.id); }
  boolean user(Authentication auth, long userId){ User u=users.findById(userId).orElseThrow(()->new NotFound("User not found")); return u.apartment != null && allowed(auth,u.apartment.id); }
  private boolean allowed(Authentication auth, long apartmentId) { User actor=users.findByEmailIgnoreCase(auth.getName()).orElseThrow(Unauthorized::new); return actor.role == Role.SUPER_ADMIN || (actor.role == Role.COMMUNITY_ADMIN && actor.apartment != null && actor.apartment.id.equals(apartmentId)); }
}

@RestControllerAdvice class Errors {
  @ExceptionHandler(NotFound.class)ResponseEntity<ApiError> nf(NotFound e){return err(HttpStatus.NOT_FOUND,"NOT_FOUND",e.getMessage());}
  @ExceptionHandler({Duplicate.class,DataIntegrityViolationException.class})ResponseEntity<ApiError> dup(Exception e){return err(HttpStatus.CONFLICT,"DUPLICATE",e.getMessage());}
  @ExceptionHandler({Invalid.class,IllegalArgumentException.class})ResponseEntity<ApiError> bad(Exception e){return err(HttpStatus.BAD_REQUEST,"INVALID_REQUEST",e.getMessage());}
  @ExceptionHandler(Unauthorized.class)ResponseEntity<ApiError> una(Unauthorized e){return err(HttpStatus.UNAUTHORIZED,"UNAUTHORIZED",e.getMessage());}
  @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)ResponseEntity<ApiError> validation(org.springframework.web.bind.MethodArgumentNotValidException e){Map<String,String> f=e.getBindingResult().getFieldErrors().stream().collect(Collectors.toMap(x->x.getField(),x->x.getDefaultMessage(),(a,b)->a,LinkedHashMap::new));return new ResponseEntity<>(new ApiError("VALIDATION_FAILED","Request validation failed",f),HttpStatus.BAD_REQUEST);}
  private ResponseEntity<ApiError> err(HttpStatus s,String c,String m){return new ResponseEntity<>(new ApiError(c,m,Map.of()),s);}
}

@CrossOrigin(origins = "*")
@RestController @RequestMapping("/api/auth") class AuthController {
  final AuthService auth; final TenantAccess tenantAccess;
  AuthController(AuthService a, TenantAccess t){auth=a;tenantAccess=t;}
  @PostMapping("/register") @PreAuthorize("hasRole('COMMUNITY_ADMIN')") ResponseEntity<UserView> register(@Valid @RequestBody RegisterRequest r, Authentication authentication){
    if(r.apartmentId()==null || !tenantAccess.apartment(authentication,r.apartmentId())) throw new org.springframework.security.access.AccessDeniedException("You cannot create residents for this community");
    return ResponseEntity.status(201).body(Views.user(auth.register(r)));
  }
  @PostMapping("/login")AuthResponse login(@Valid @RequestBody LoginRequest r){return auth.login(r);}
}
@CrossOrigin(origins = "*")
@RestController @RequestMapping("/api/users") class UsersController {
  final AuthService auth;UsersController(AuthService a){auth=a;}
  @GetMapping("/me")@PreAuthorize("hasAnyRole('SUPER_ADMIN','COMMUNITY_ADMIN','RESIDENT')")UserView me(Authentication a){return Views.user(auth.me(a.getName()));}
  @PutMapping("/me")@PreAuthorize("hasAnyRole('SUPER_ADMIN','COMMUNITY_ADMIN','RESIDENT')")UserView update(Authentication a,@Valid @RequestBody UserUpdateRequest r){return Views.user(auth.update(a.getName(),r));}
  @GetMapping @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMMUNITY_ADMIN')")List<UserView> listAll(){return auth.listAll();}
  @GetMapping("/pending") @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMMUNITY_ADMIN')") List<UserView> listPending(){return auth.listPendingUsers();}
  @PutMapping("/{id}/approve") @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMMUNITY_ADMIN') and @tenantAccess.user(authentication,#root.args[0])") UserView approve(@PathVariable long id){return Views.user(auth.approveUser(id));}
  @PutMapping("/{id}/reject") @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMMUNITY_ADMIN') and @tenantAccess.user(authentication,#root.args[0])") UserView reject(@PathVariable long id){return Views.user(auth.rejectUser(id));}
}
@CrossOrigin(origins = "*")
@RestController @RequestMapping("/api/apartments") class ApartmentsController {
  final AppService app; final TenantAccess tenantAccess;
  ApartmentsController(AppService a, TenantAccess t){app=a;tenantAccess=t;}
  @PutMapping("/{id}") @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMMUNITY_ADMIN') and @tenantAccess.apartment(authentication,#root.args[0])")ApartmentView update(@PathVariable long id, @Valid @RequestBody ApartmentRequest r){return Views.apartment(app.updateApartment(id,r));}
  @GetMapping("/{id}") @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMMUNITY_ADMIN','RESIDENT')")ApartmentView get(@PathVariable long id){return Views.apartment(app.apartment(id));}
  @GetMapping("/{id}/summary") @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMMUNITY_ADMIN') and @tenantAccess.apartment(authentication,#root.args[0])")DashboardSummary summary(@PathVariable long id){return app.getDashboardSummary(id);}
  @GetMapping("/{id}/households") @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMMUNITY_ADMIN','RESIDENT')")List<HouseholdView> households(@PathVariable long id){return app.getHouseholds(id);}
  @PostMapping("/{id}/households") @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMMUNITY_ADMIN')") ResponseEntity<HouseholdView> household(@PathVariable long id, @Valid @RequestBody HouseholdRequest r, Authentication authentication){
    if(!tenantAccess.apartment(authentication,id)) throw new org.springframework.security.access.AccessDeniedException("You cannot manage this community");
    return ResponseEntity.status(201).body(Views.household(app.createHousehold(id,r)));
  }
  @PostMapping(value="/{id}/usage/bulk-csv",consumes=MediaType.MULTIPART_FORM_DATA_VALUE) @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMMUNITY_ADMIN') and @tenantAccess.apartment(authentication,#root.args[0])")List<UsageView> bulk(@PathVariable long id,@RequestPart("file") MultipartFile file){return app.csv(id,file);}

  @PostMapping("/{id}/tariff-plans") @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMMUNITY_ADMIN') and @tenantAccess.apartment(authentication,#root.args[0])")ResponseEntity<TariffPlanView> createPlan(@PathVariable long id, @Valid @RequestBody TariffPlanRequest r){return ResponseEntity.status(201).body(Views.plan(app.createPlan(id,r)));}
  @GetMapping("/{id}/tariff-plans") @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMMUNITY_ADMIN','RESIDENT')")List<TariffPlanView> getPlans(@PathVariable long id){return app.getPlans(id);}
  @PutMapping("/{id}/tariff-plans/{planId}") @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMMUNITY_ADMIN') and @tenantAccess.apartment(authentication,#root.args[0])")TariffPlanView updatePlan(@PathVariable long id, @PathVariable long planId, @Valid @RequestBody TariffPlanRequest r){return Views.plan(app.updatePlan(id,planId,r));}
  @DeleteMapping("/{id}/tariff-plans/{planId}") @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMMUNITY_ADMIN') and @tenantAccess.apartment(authentication,#root.args[0])")ResponseEntity<Void> deletePlan(@PathVariable long id, @PathVariable long planId){app.deletePlan(id,planId); return ResponseEntity.noContent().build();}

  @PostMapping("/{id}/billing-cycles") @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMMUNITY_ADMIN') and @tenantAccess.apartment(authentication,#root.args[0])")ResponseEntity<BillingCycleView> createCycle(@PathVariable long id, @Valid @RequestBody BillingCycleRequest r){return ResponseEntity.status(201).body(Views.cycle(app.createCycle(id,r)));}
  @GetMapping("/{id}/billing-cycles") @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMMUNITY_ADMIN','RESIDENT')")List<BillingCycleView> getCycles(@PathVariable long id){return app.getCycles(id);}
}
@CrossOrigin(origins = "*")
@RestController @RequestMapping("/api/admin") class AdminController {
  final AppService app; AdminController(AppService a){app=a;}
  @PostMapping("/reset-data") @PreAuthorize("hasRole('SUPER_ADMIN')") Map<String, String> resetData(){ return app.resetAllData(); }
}
@CrossOrigin(origins = "*")
@RestController @RequestMapping("/api/super-admin") class SuperAdminController {
  final AppService app; final AuthService auth; final ApartmentRepo apartments;
  SuperAdminController(AppService app, AuthService auth, ApartmentRepo apartments){this.app=app;this.auth=auth;this.apartments=apartments;}
  @PostMapping("/communities") @PreAuthorize("hasRole('SUPER_ADMIN')") ResponseEntity<ApartmentView> create(@Valid @RequestBody ApartmentRequest r){return ResponseEntity.status(HttpStatus.CREATED).body(Views.apartment(app.create(r)));}
  @GetMapping("/communities") @PreAuthorize("hasRole('SUPER_ADMIN')") List<ApartmentView> list(){return apartments.findAll().stream().map(Views::apartment).toList();}
  @GetMapping("/communities/{id}") @PreAuthorize("hasRole('SUPER_ADMIN')") ApartmentView get(@PathVariable long id){return Views.apartment(app.apartment(id));}
  @PostMapping("/communities/{id}/admins") @PreAuthorize("hasRole('SUPER_ADMIN')") ResponseEntity<UserView> createAdmin(@PathVariable long id,@Valid @RequestBody CommunityAdminRequest r){
    return ResponseEntity.status(HttpStatus.CREATED).body(Views.user(auth.createCommunityAdmin(id,new RegisterRequest(id,null,r.name(),r.email(),r.password(),Role.COMMUNITY_ADMIN,null,null,null))));
  }
}
@CrossOrigin(origins = "*")
@RestController @RequestMapping("/api/households") class HouseholdsController {
  final AppService app;HouseholdsController(AppService a){app=a;}
  @GetMapping("/{id}") @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMMUNITY_ADMIN','RESIDENT')")HouseholdView get(@PathVariable long id){return Views.household(app.household(id));}
  @PutMapping("/{id}") @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMMUNITY_ADMIN') and @tenantAccess.household(authentication,#root.args[0])")HouseholdView put(@PathVariable long id,@Valid @RequestBody HouseholdRequest r){return Views.household(app.updateHousehold(id,r));}
  @DeleteMapping("/{id}") @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMMUNITY_ADMIN') and @tenantAccess.household(authentication,#root.args[0])")ResponseEntity<Void> delete(@PathVariable long id){app.deleteHousehold(id); return ResponseEntity.noContent().build();}
  @PutMapping("/{id}/meter") @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMMUNITY_ADMIN') and @tenantAccess.household(authentication,#root.args[0])")HouseholdView meter(@PathVariable long id,@RequestBody MeterRequest r){return Views.household(app.meter(id,r));}
  @PostMapping("/{id}/usage") @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMMUNITY_ADMIN','RESIDENT')")ResponseEntity<UsageView> usage(@PathVariable long id,@Valid @RequestBody UsageRequest r){return ResponseEntity.status(201).body(app.log(id,r,UsageSource.MANUAL));}
  @GetMapping("/usage") @PreAuthorize("hasAnyRole('ADMIN','RESIDENT')")List<UsageView> getAllUsage(){return app.getAllUsageLogs();}
  @GetMapping("/{id}/benchmark") @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMMUNITY_ADMIN','RESIDENT')")BenchmarkView getBenchmark(@PathVariable long id){return app.getBenchmark(id);}
}
@CrossOrigin(origins = "*")
@RestController @RequestMapping("/api/procurements") class ProcurementController {
  final AppService app; ProcurementController(AppService a){app=a;}
  @GetMapping @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMMUNITY_ADMIN','RESIDENT')") List<WaterPurchaseView> getAll(){return app.getAllPurchases();}
  @PostMapping @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMMUNITY_ADMIN') and @tenantAccess.cycle(authentication,#p0.billingCycleId())") ResponseEntity<WaterPurchaseView> create(@Valid @RequestBody DirectWaterPurchaseRequest r){return ResponseEntity.status(201).body(Views.purchase(app.addDirectPurchase(r)));}
  @PutMapping("/{id}") @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMMUNITY_ADMIN') and @tenantAccess.purchase(authentication,#p0)") WaterPurchaseView update(@PathVariable long id, @Valid @RequestBody DirectWaterPurchaseRequest r){return Views.purchase(app.updateDirectPurchase(id, r));}
  @DeleteMapping("/{id}") @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMMUNITY_ADMIN') and @tenantAccess.purchase(authentication,#p0)") ResponseEntity<Void> delete(@PathVariable long id){app.deleteDirectPurchase(id); return ResponseEntity.noContent().build();}
}
@CrossOrigin(origins = "*")
@RestController @RequestMapping("/api/billing-cycles") class BillingCyclesController {
  final AppService app;BillingCyclesController(AppService a){app=a;}
  @GetMapping("/invoices") @PreAuthorize("hasAnyRole('ADMIN','RESIDENT')")List<InvoiceView> getAllInvoices(){return app.getAllInvoices();}
  @GetMapping("/{id}") @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMMUNITY_ADMIN','RESIDENT')")BillingCycleView getCycle(@PathVariable long id){return Views.cycle(app.getCycle(id));}
  @PostMapping("/{id}/purchases") @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMMUNITY_ADMIN') and @tenantAccess.cycle(authentication,#p0)")ResponseEntity<WaterPurchaseView> addPurchase(@PathVariable long id, @Valid @RequestBody WaterPurchaseRequest r){return ResponseEntity.status(201).body(Views.purchase(app.addPurchase(id,r)));}
  @GetMapping("/{id}/purchases") @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMMUNITY_ADMIN','RESIDENT')")List<WaterPurchaseView> getPurchases(@PathVariable long id){return app.getPurchases(id);}
  @PutMapping("/{id}/purchases/{purchaseId}") @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMMUNITY_ADMIN') and @tenantAccess.cycle(authentication,#p0)")WaterPurchaseView updatePurchase(@PathVariable long id, @PathVariable long purchaseId, @Valid @RequestBody WaterPurchaseRequest r){return Views.purchase(app.updatePurchase(id,purchaseId,r));}
  @DeleteMapping("/{id}/purchases/{purchaseId}") @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMMUNITY_ADMIN') and @tenantAccess.cycle(authentication,#p0)")ResponseEntity<Void> deletePurchase(@PathVariable long id, @PathVariable long purchaseId){app.deletePurchase(id,purchaseId); return ResponseEntity.noContent().build();}
  @PostMapping("/{id}/finalize") @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMMUNITY_ADMIN') and @tenantAccess.cycle(authentication,#p0)")List<InvoiceView> finalizeCycle(@PathVariable long id){return app.finalizeCycle(id);}
  @GetMapping("/{id}/invoices") @PreAuthorize("hasAnyRole('ADMIN','RESIDENT')")List<InvoiceView> getInvoices(@PathVariable long id){return app.getInvoices(id);}
  @PutMapping("/invoices/{invoiceId}/pay") @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMMUNITY_ADMIN') and @tenantAccess.invoice(authentication,#p0)")InvoiceView payInvoice(@PathVariable long invoiceId){return Views.invoice(app.markInvoicePaid(invoiceId));}
  @PostMapping("/{id}/archive") @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMMUNITY_ADMIN') and @tenantAccess.cycle(authentication,#p0)")BillingCycleView archiveCycle(@PathVariable long id){return Views.cycle(app.archiveCycle(id));}
}
@CrossOrigin(origins = "*")
@RestController @RequestMapping("/api/invoices") class InvoicesController {
  final PdfInvoiceService pdfService; final AppService app; InvoicesController(PdfInvoiceService p, AppService a){this.pdfService=p; this.app=a;}
  @GetMapping(value="/{id}/pdf", produces=MediaType.APPLICATION_PDF_VALUE) @PreAuthorize("hasAnyRole('ADMIN','RESIDENT')") ResponseEntity<byte[]> getPdf(@PathVariable long id) throws IOException {
    byte[] pdf = pdfService.generateInvoicePdf(id);
    HttpHeaders h = new HttpHeaders();
    h.setContentType(MediaType.APPLICATION_PDF);
    h.setContentDisposition(ContentDisposition.attachment().filename("SmartWater_Invoice_" + id + ".pdf").build());
    return new ResponseEntity<>(pdf, h, HttpStatus.OK);
  }
  @PutMapping("/{id}/pay") @PreAuthorize("hasAnyRole('ADMIN','RESIDENT')") InvoiceView payInvoice(@PathVariable long id, @RequestBody(required=false) PaymentRequest r) {
    return Views.invoice(app.payInvoice(id, r));
  }
}
@CrossOrigin(origins = "*")
@RestController @RequestMapping("/api/resident-messages") class ResidentMessagesController {
  final AppService app; final AuthService auth;
  ResidentMessagesController(AppService a, AuthService au){app=a; auth=au;}
  @PostMapping @PreAuthorize("hasAnyRole('ADMIN','RESIDENT')")
  ResidentMessageView sendMessage(Authentication authentication, @Valid @RequestBody ResidentMessageReq r) {
    User u = auth.me(authentication.getName());
    return Views.residentMessage(app.sendResidentMessage(u, r));
  }
  @GetMapping @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMMUNITY_ADMIN')")
  List<ResidentMessageView> listAll() { return app.listResidentMessages(); }
  @GetMapping("/my") @PreAuthorize("hasAnyRole('ADMIN','RESIDENT')")
  List<ResidentMessageView> listMy(Authentication authentication) {
    User u = auth.me(authentication.getName());
    return app.listMyResidentMessages(u.household != null ? u.household.id : null);
  }
  @PutMapping("/{id}/read") @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMMUNITY_ADMIN') and @tenantAccess.message(authentication,#p0)")
  ResidentMessageView markRead(@PathVariable long id) { return Views.residentMessage(app.markResidentMessageRead(id)); }
}

@CrossOrigin(origins = "*")
@RestController @RequestMapping("/api/alerts") class AlertsController {
  final AppService app; final AlertEngineService alertEngine; AlertsController(AppService a, AlertEngineService ae){app=a; alertEngine=ae;}
  @GetMapping @PreAuthorize("hasAnyRole('ADMIN','RESIDENT')")List<AlertView> getAlerts(){return app.getAlerts();}
  @PutMapping("/{id}/resolve") @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMMUNITY_ADMIN') and @tenantAccess.alert(authentication,#p0)")AlertView resolve(@PathVariable long id){return Views.alert(app.markAlertResolved(id));}
  @PostMapping("/evaluate") @PreAuthorize("hasRole('SUPER_ADMIN')")AlertAuditResult evaluate(){return alertEngine.evaluateAlerts();}
  @PostMapping("/send-message") @PreAuthorize("hasRole('ADMIN')")AlertView sendMessage(@Valid @RequestBody AdminMessageRequest r){return Views.alert(app.sendAdminMessage(r));}
}
