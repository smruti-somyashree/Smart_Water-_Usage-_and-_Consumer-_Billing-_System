package com.smartwater.billing;

import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.jsonwebtoken.Claims; import io.jsonwebtoken.Jwts; import io.jsonwebtoken.security.Keys;
import jakarta.persistence.*; import jakarta.servlet.*; import jakarta.servlet.http.*; import jakarta.validation.Valid; import jakarta.validation.constraints.*;
import org.springframework.beans.factory.annotation.Value; import org.springframework.boot.*; import org.springframework.boot.autoconfigure.SpringBootApplication; import org.springframework.context.annotation.*; import org.springframework.dao.DataIntegrityViolationException; import org.springframework.data.jpa.repository.JpaRepository; import org.springframework.http.*; import org.springframework.security.access.prepost.PreAuthorize; import org.springframework.security.authentication.UsernamePasswordAuthenticationToken; import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity; import org.springframework.security.config.annotation.web.builders.HttpSecurity; import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity; import org.springframework.security.config.http.SessionCreationPolicy; import org.springframework.security.core.*; import org.springframework.security.core.authority.SimpleGrantedAuthority; import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder; import org.springframework.security.crypto.password.PasswordEncoder; import org.springframework.security.web.*; import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter; import org.springframework.stereotype.*; import org.springframework.transaction.annotation.Transactional; import org.springframework.web.bind.annotation.*; import org.springframework.web.multipart.MultipartFile;
import java.io.*; import java.math.BigDecimal; import java.nio.charset.StandardCharsets; import java.security.Key; import java.time.*; import java.util.*; import java.util.stream.*;

@SpringBootApplication public class SmartWaterApplication { public static void main(String[] a){SpringApplication.run(SmartWaterApplication.class,a);} }

enum Role { ADMIN, RESIDENT } enum UsageSource { MANUAL, CSV_BULK } enum CycleStatus { OPEN, FINALIZED, ARCHIVED }

@Entity @Table(name="apartments") class Apartment {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
  String name; String address; int totalUnits; Instant createdAt=Instant.now();
  @OneToMany(mappedBy="apartment", cascade=CascadeType.ALL, orphanRemoval=true) @JsonIgnore List<Household> households=new ArrayList<>();
  @OneToMany(mappedBy="apartment", cascade=CascadeType.ALL, orphanRemoval=true) @JsonIgnore List<TariffPlan> tariffPlans=new ArrayList<>();
  @OneToMany(mappedBy="apartment", cascade=CascadeType.ALL, orphanRemoval=true) @JsonIgnore List<BillingCycle> billingCycles=new ArrayList<>();
}
@Entity @Table(name="households") class Household {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
  @ManyToOne(optional=false) Apartment apartment;
  String flatNumber; int flatSizeSqft; int occupancyCount; boolean hasMeter;
  @OneToMany(mappedBy="household", cascade=CascadeType.ALL, orphanRemoval=true) @JsonIgnore List<WaterUsageLog> usageLogs=new ArrayList<>();
}
@Entity @Table(name="users") class User {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
  @ManyToOne Household household;
  @ManyToOne(optional=false) Apartment apartment;
  String email; @JsonIgnore String passwordHash;
  @Enumerated(EnumType.STRING) Role role; Instant createdAt=Instant.now();
}
@Entity @Table(name="water_usage_logs", uniqueConstraints=@UniqueConstraint(columnNames={"household_id","reading_date"})) class WaterUsageLog {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
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
  @ManyToOne(optional=false) Apartment apartment;
  @ManyToOne(optional=false) TariffPlan tariffPlan;
  LocalDate startsOn; LocalDate endsOn;
  @Enumerated(EnumType.STRING) CycleStatus status=CycleStatus.OPEN; Instant createdAt=Instant.now();
}
@Entity @Table(name="water_purchases") class WaterPurchase {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
  @ManyToOne(optional=false) BillingCycle billingCycle;
  String source; LocalDate purchasedOn;
  @Column(precision=12,scale=3) BigDecimal volumeKl;
  @Column(precision=12,scale=3) BigDecimal unitCost;
  String notes; Instant createdAt=Instant.now();
}
@Entity @Table(name="invoices") class Invoice {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
  @ManyToOne(optional=false) BillingCycle billingCycle;
  @ManyToOne(optional=false) Household household;
  @Column(precision=12,scale=3) BigDecimal consumptionKl;
  @Column(precision=12,scale=3) BigDecimal totalAmount;
  String status="UNPAID"; Instant createdAt=Instant.now();
}
@Entity @Table(name="alerts") class Alert {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
  @ManyToOne Apartment apartment;
  @ManyToOne Household household;
  String type; String message; boolean resolved=false; Instant createdAt=Instant.now();
}

interface ApartmentRepo extends JpaRepository<Apartment,Long>{}
interface HouseholdRepo extends JpaRepository<Household,Long>{ Optional<Household> findByApartmentIdAndFlatNumber(Long a,String f); List<Household> findByApartmentId(Long a); }
interface UserRepo extends JpaRepository<User,Long>{ Optional<User> findByEmailIgnoreCase(String e); boolean existsByEmailIgnoreCase(String e); }
interface UsageRepo extends JpaRepository<WaterUsageLog,Long>{ boolean existsByHouseholdIdAndReadingDate(Long h,LocalDate d); List<WaterUsageLog> findByHouseholdIdAndReadingDateBetween(Long h, LocalDate start, LocalDate end); }
interface TariffPlanRepo extends JpaRepository<TariffPlan,Long>{ List<TariffPlan> findByApartmentId(Long a); }
interface BillingCycleRepo extends JpaRepository<BillingCycle,Long>{ List<BillingCycle> findByApartmentId(Long a); }
interface WaterPurchaseRepo extends JpaRepository<WaterPurchase,Long>{ List<WaterPurchase> findByBillingCycleId(Long c); }
interface InvoiceRepo extends JpaRepository<Invoice,Long>{ List<Invoice> findByBillingCycleId(Long c); }
interface AlertRepo extends JpaRepository<Alert,Long>{ List<Alert> findAll(); }

record RegisterRequest(@NotNull Long apartmentId, Long householdId, @NotBlank @Email String email, @NotBlank @Size(min=8,max=72) String password, @NotNull Role role){}
record LoginRequest(@NotBlank @Email String email,@NotBlank String password){}
record AuthResponse(String accessToken,String refreshToken,UserView user){}
record ApartmentRequest(@NotBlank @Size(max=120) String name,@NotBlank @Size(max=300) String address,@Positive int totalUnits){}
record HouseholdRequest(@NotBlank @Size(max=30) String flatNumber,@Positive int flatSizeSqft,@Positive int occupancyCount,boolean hasMeter){}
record MeterRequest(boolean hasMeter){}
record UsageRequest(@NotNull @PastOrPresent LocalDate readingDate,@NotNull @DecimalMin("0.0") BigDecimal meterReadingKl){}
record UserUpdateRequest(@NotBlank @Email String email){}

record TariffPlanRequest(@NotBlank String name, @NotNull @DecimalMin("0.0") BigDecimal baseThresholdKl, @NotNull @DecimalMin("0.0") BigDecimal baseRate, @NotNull @DecimalMin("0.0") BigDecimal excessRate, @NotNull @DecimalMin("0.0") BigDecimal overuseThresholdKl, Boolean active){}
record BillingCycleRequest(@NotNull Long tariffPlanId, @NotNull LocalDate startsOn, @NotNull LocalDate endsOn){}
record WaterPurchaseRequest(@NotBlank String source, @NotNull LocalDate purchasedOn, @NotNull @DecimalMin("0.0") BigDecimal volumeKl, @NotNull @DecimalMin("0.0") BigDecimal unitCost, String notes){}

record ApartmentView(Long id,String name,String address,int totalUnits){}
record HouseholdView(Long id,Long apartmentId,String flatNumber,int flatSizeSqft,int occupancyCount,boolean hasMeter){}
record UserView(Long id,Long householdId,Long apartmentId,String email,Role role){}
record UsageView(Long id,Long householdId,LocalDate readingDate,BigDecimal meterReadingKl,UsageSource source){}
record TariffPlanView(Long id,Long apartmentId,String name,BigDecimal baseThresholdKl,BigDecimal baseRate,BigDecimal excessRate,BigDecimal overuseThresholdKl,boolean active){}
record BillingCycleView(Long id,Long apartmentId,Long tariffPlanId,LocalDate startsOn,LocalDate endsOn,CycleStatus status){}
record WaterPurchaseView(Long id,Long billingCycleId,String source,LocalDate purchasedOn,BigDecimal volumeKl,BigDecimal unitCost,String notes){}
record InvoiceView(Long id,Long billingCycleId,Long householdId,BigDecimal consumptionKl,BigDecimal totalAmount,String status){}
record AlertView(Long id,Long apartmentId,Long householdId,String type,String message,boolean resolved){}
record ApiError(String code,String message,Map<String,String> fields){}

class Views {
  static ApartmentView apartment(Apartment a){return new ApartmentView(a.id,a.name,a.address,a.totalUnits);}
  static HouseholdView household(Household h){return new HouseholdView(h.id,h.apartment.id,h.flatNumber,h.flatSizeSqft,h.occupancyCount,h.hasMeter);}
  static UserView user(User u){return new UserView(u.id,u.household==null?null:u.household.id,u.apartment.id,u.email,u.role);}
  static UsageView usage(WaterUsageLog l){return new UsageView(l.id,l.household.id,l.readingDate,l.meterReadingKl,l.source);}
  static TariffPlanView plan(TariffPlan p){return new TariffPlanView(p.id,p.apartment.id,p.name,p.baseThresholdKl,p.baseRate,p.excessRate,p.overuseThresholdKl,p.active);}
  static BillingCycleView cycle(BillingCycle c){return new BillingCycleView(c.id,c.apartment.id,c.tariffPlan.id,c.startsOn,c.endsOn,c.status);}
  static WaterPurchaseView purchase(WaterPurchase p){return new WaterPurchaseView(p.id,p.billingCycle.id,p.source,p.purchasedOn,p.volumeKl,p.unitCost,p.notes);}
  static InvoiceView invoice(Invoice i){return new InvoiceView(i.id,i.billingCycle.id,i.household.id,i.consumptionKl,i.totalAmount,i.status);}
  static AlertView alert(Alert a){return new AlertView(a.id,a.apartment==null?null:a.apartment.id,a.household==null?null:a.household.id,a.type,a.message,a.resolved);}
}

@Service class AppService {
  final ApartmentRepo apartments; final HouseholdRepo households; final UsageRepo usage;
  final TariffPlanRepo tariffPlans; final BillingCycleRepo billingCycles; final WaterPurchaseRepo purchases;
  final InvoiceRepo invoices; final AlertRepo alerts;

  AppService(ApartmentRepo a,HouseholdRepo h,UsageRepo u,TariffPlanRepo tp,BillingCycleRepo bc,WaterPurchaseRepo p,InvoiceRepo i,AlertRepo al){
    apartments=a;households=h;usage=u;tariffPlans=tp;billingCycles=bc;purchases=p;invoices=i;alerts=al;
  }
  Apartment create(ApartmentRequest r){Apartment a=new Apartment();a.name=r.name();a.address=r.address();a.totalUnits=r.totalUnits();return apartments.save(a);}
  Apartment apartment(long id){return apartments.findById(id).orElseThrow(()->new NotFound("Apartment not found"));}
  Household household(long id){return households.findById(id).orElseThrow(()->new NotFound("Household not found"));}
  Household createHousehold(long id,HouseholdRequest r){Apartment a=apartment(id); if(households.findByApartmentIdAndFlatNumber(id,r.flatNumber()).isPresent())throw new Duplicate("Flat number already exists in apartment"); Household h=new Household();h.apartment=a;apply(h,r);return households.save(h);}
  Household updateHousehold(long id,HouseholdRequest r){Household h=household(id); apply(h,r);return households.save(h);}
  private void apply(Household h,HouseholdRequest r){h.flatNumber=r.flatNumber();h.flatSizeSqft=r.flatSizeSqft();h.occupancyCount=r.occupancyCount();h.hasMeter=r.hasMeter();}
  Household meter(long id,MeterRequest r){Household h=household(id);h.hasMeter=r.hasMeter();return households.save(h);}
  UsageView log(long householdId,UsageRequest r,UsageSource source){Household h=household(householdId);if(!h.hasMeter)throw new Invalid("Household has no configured meter");if(usage.existsByHouseholdIdAndReadingDate(h.id,r.readingDate()))throw new Duplicate("A reading already exists for this date");WaterUsageLog l=new WaterUsageLog();l.household=h;l.readingDate=r.readingDate();l.meterReadingKl=r.meterReadingKl();l.source=source;return Views.usage(usage.save(l));}
  @Transactional List<UsageView> csv(long apartmentId,MultipartFile f){apartment(apartmentId); if(f.isEmpty())throw new Invalid("CSV file is empty"); List<UsageView> output=new ArrayList<>(); try(BufferedReader br=new BufferedReader(new InputStreamReader(f.getInputStream(),StandardCharsets.UTF_8))){String header=br.readLine(); if(header==null||!header.trim().equalsIgnoreCase("flat_number,reading_date,meter_reading_kl"))throw new Invalid("CSV header must be flat_number,reading_date,meter_reading_kl");String line;int row=1;while((line=br.readLine())!=null){row++;final int lineNo=row;String[] p=line.split(",",-1);if(p.length!=3)throw new Invalid("Invalid CSV row "+row); Household h=households.findByApartmentIdAndFlatNumber(apartmentId,p[0].trim()).orElseThrow(()->new Invalid("Unknown flat at row "+lineNo)); try{output.add(log(h.id,new UsageRequest(LocalDate.parse(p[1].trim()),new BigDecimal(p[2].trim())),UsageSource.CSV_BULK));}catch(NumberFormatException|java.time.format.DateTimeParseException e){throw new Invalid("Invalid date or reading at row "+row);}}}catch(IOException e){throw new Invalid("Cannot read CSV file");} return output;}

  TariffPlan createPlan(long apartmentId, TariffPlanRequest r){Apartment a=apartment(apartmentId); TariffPlan p=new TariffPlan(); p.apartment=a; applyPlan(p,r); return tariffPlans.save(p);}
  TariffPlan updatePlan(long apartmentId, long planId, TariffPlanRequest r){TariffPlan p=tariffPlans.findById(planId).orElseThrow(()->new NotFound("Tariff plan not found")); applyPlan(p,r); return tariffPlans.save(p);}
  private void applyPlan(TariffPlan p, TariffPlanRequest r){p.name=r.name(); p.baseThresholdKl=r.baseThresholdKl(); p.baseRate=r.baseRate(); p.excessRate=r.excessRate(); p.overuseThresholdKl=r.overuseThresholdKl(); if(r.active()!=null) p.active=r.active();}
  List<TariffPlanView> getPlans(long apartmentId){apartment(apartmentId); return tariffPlans.findByApartmentId(apartmentId).stream().map(Views::plan).toList();}

  BillingCycle createCycle(long apartmentId, BillingCycleRequest r){Apartment a=apartment(apartmentId); TariffPlan tp=tariffPlans.findById(r.tariffPlanId()).orElseThrow(()->new NotFound("Tariff plan not found")); BillingCycle c=new BillingCycle(); c.apartment=a; c.tariffPlan=tp; c.startsOn=r.startsOn(); c.endsOn=r.endsOn(); c.status=CycleStatus.OPEN; return billingCycles.save(c);}
  List<BillingCycleView> getCycles(long apartmentId){apartment(apartmentId); return billingCycles.findByApartmentId(apartmentId).stream().map(Views::cycle).toList();}
  BillingCycle getCycle(long cycleId){return billingCycles.findById(cycleId).orElseThrow(()->new NotFound("Billing cycle not found"));}
  
  WaterPurchase addPurchase(long cycleId, WaterPurchaseRequest r){BillingCycle c=getCycle(cycleId); WaterPurchase p=new WaterPurchase(); p.billingCycle=c; applyPurchase(p,r); return purchases.save(p);}
  List<WaterPurchaseView> getPurchases(long cycleId){getCycle(cycleId); return purchases.findByBillingCycleId(cycleId).stream().map(Views::purchase).toList();}
  WaterPurchase updatePurchase(long cycleId, long purchaseId, WaterPurchaseRequest r){WaterPurchase p=purchases.findById(purchaseId).orElseThrow(()->new NotFound("Purchase not found")); applyPurchase(p,r); return purchases.save(p);}
  void deletePurchase(long cycleId, long purchaseId){WaterPurchase p=purchases.findById(purchaseId).orElseThrow(()->new NotFound("Purchase not found")); purchases.delete(p);}
  private void applyPurchase(WaterPurchase p, WaterPurchaseRequest r){p.source=r.source(); p.purchasedOn=r.purchasedOn(); p.volumeKl=r.volumeKl(); p.unitCost=r.unitCost(); p.notes=r.notes();}

  @Transactional List<InvoiceView> finalizeCycle(long cycleId){
    BillingCycle c=getCycle(cycleId);
    List<Household> hhList = households.findByApartmentId(c.apartment.id);
    TariffPlan tp = c.tariffPlan;
    List<Invoice> generated = new ArrayList<>();
    for(Household h : hhList){
      List<WaterUsageLog> logs = usage.findByHouseholdIdAndReadingDateBetween(h.id, c.startsOn, c.endsOn);
      BigDecimal totalConsumption = logs.stream().map(l -> l.meterReadingKl).reduce(BigDecimal.ZERO, BigDecimal::add);
      BigDecimal amount = BigDecimal.ZERO;
      if(totalConsumption.compareTo(tp.baseThresholdKl) <= 0){
        amount = totalConsumption.multiply(tp.baseRate);
      } else {
        BigDecimal baseAmt = tp.baseThresholdKl.multiply(tp.baseRate);
        BigDecimal excessVol = totalConsumption.subtract(tp.baseThresholdKl);
        BigDecimal excessAmt = excessVol.multiply(tp.excessRate);
        amount = baseAmt.add(excessAmt);
      }
      Invoice inv = new Invoice(); inv.billingCycle=c; inv.household=h; inv.consumptionKl=totalConsumption; inv.totalAmount=amount; inv.status="UNPAID";
      generated.add(invoices.save(inv));
    }
    c.status = CycleStatus.FINALIZED; billingCycles.save(c);
    return generated.stream().map(Views::invoice).toList();
  }

  List<InvoiceView> getInvoices(long cycleId){getCycle(cycleId); return invoices.findByBillingCycleId(cycleId).stream().map(Views::invoice).toList();}
  BillingCycle archiveCycle(long cycleId){BillingCycle c=getCycle(cycleId); c.status=CycleStatus.ARCHIVED; return billingCycles.save(c);}
  List<AlertView> getAlerts(){return alerts.findAll().stream().map(Views::alert).toList();}
}

@Service class AuthService {
  final UserRepo users;final ApartmentRepo apartments;final HouseholdRepo households;final PasswordEncoder encoder;final Jwt jwt;
  AuthService(UserRepo u,ApartmentRepo a,HouseholdRepo h,PasswordEncoder e,Jwt j){users=u;apartments=a;households=h;encoder=e;jwt=j;}
  User register(RegisterRequest r){if(users.existsByEmailIgnoreCase(r.email()))throw new Duplicate("Email already registered");Apartment a=apartments.findById(r.apartmentId()).orElseThrow(()->new NotFound("Apartment not found"));Household h=null;if(r.householdId()!=null){h=households.findById(r.householdId()).orElseThrow(()->new NotFound("Household not found"));if(!h.apartment.id.equals(a.id))throw new Invalid("Household is not in apartment");}if(r.role()==Role.RESIDENT&&h==null)throw new Invalid("Residents require a household");User u=new User();u.apartment=a;u.household=h;u.email=r.email().toLowerCase();u.passwordHash=encoder.encode(r.password());u.role=r.role();return users.save(u);}
  AuthResponse login(LoginRequest r){User u=users.findByEmailIgnoreCase(r.email()).orElseThrow(()->new Unauthorized());if(!encoder.matches(r.password(),u.passwordHash))throw new Unauthorized();return new AuthResponse(jwt.access(u),jwt.refresh(u),Views.user(u));}
  User me(String email){return users.findByEmailIgnoreCase(email).orElseThrow(Unauthorized::new);}
  User update(String email,UserUpdateRequest r){User u=me(email);if(!u.email.equalsIgnoreCase(r.email())&&users.existsByEmailIgnoreCase(r.email()))throw new Duplicate("Email already registered");u.email=r.email().toLowerCase();return users.save(u);}
  List<UserView> listAll(){return users.findAll().stream().map(Views::user).toList();}
}

@Component class Jwt {
  final Key key;final long accessMinutes,refreshDays;
  Jwt(@Value("${app.jwt.secret}")String secret,@Value("${app.jwt.access-minutes}")long access,@Value("${app.jwt.refresh-days}")long refresh){key=Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));accessMinutes=access;refreshDays=refresh;}
  String access(User u){return make(u,Duration.ofMinutes(accessMinutes),"access");}String refresh(User u){return make(u,Duration.ofDays(refreshDays),"refresh");}
  String make(User u,Duration d,String type){return Jwts.builder().subject(u.email).claim("role",u.role.name()).claim("type",type).issuedAt(new Date()).expiration(Date.from(Instant.now().plus(d))).signWith(key).compact();}
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
      .authorizeHttpRequests(a->a.requestMatchers("/api/auth/**","/swagger-ui.html","/swagger-ui/**","/v3/api-docs/**","/v3/api-docs","/swagger-resources/**","/webjars/**","/h2-console/**").permitAll().anyRequest().authenticated())
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
  final AuthService auth;AuthController(AuthService a){auth=a;}
  @PostMapping("/register")ResponseEntity<UserView> register(@Valid @RequestBody RegisterRequest r){return ResponseEntity.status(201).body(Views.user(auth.register(r)));}
  @PostMapping("/login")AuthResponse login(@Valid @RequestBody LoginRequest r){return auth.login(r);}
}
@CrossOrigin(origins = "*")
@RestController @RequestMapping("/api/users") class UsersController {
  final AuthService auth;UsersController(AuthService a){auth=a;}
  @GetMapping("/me")@PreAuthorize("hasAnyRole('ADMIN','RESIDENT')")UserView me(Authentication a){return Views.user(auth.me(a.getName()));}
  @PutMapping("/me")@PreAuthorize("hasAnyRole('ADMIN','RESIDENT')")UserView update(Authentication a,@Valid @RequestBody UserUpdateRequest r){return Views.user(auth.update(a.getName(),r));}
  @GetMapping @PreAuthorize("hasRole('ADMIN')")List<UserView> listAll(){return auth.listAll();}
}
@CrossOrigin(origins = "*")
@RestController @RequestMapping("/api/apartments") class ApartmentsController {
  final AppService app;ApartmentsController(AppService a){app=a;}
  @PostMapping @PreAuthorize("hasRole('ADMIN')")ResponseEntity<ApartmentView> create(@Valid @RequestBody ApartmentRequest r){return ResponseEntity.status(201).body(Views.apartment(app.create(r)));}
  @GetMapping("/{id}") @PreAuthorize("hasAnyRole('ADMIN','RESIDENT')")ApartmentView get(@PathVariable long id){return Views.apartment(app.apartment(id));}
  @PostMapping("/{id}/households") @PreAuthorize("hasRole('ADMIN')")ResponseEntity<HouseholdView> household(@PathVariable long id,@Valid @RequestBody HouseholdRequest r){return ResponseEntity.status(201).body(Views.household(app.createHousehold(id,r)));}
  @PostMapping(value="/{id}/usage/bulk-csv",consumes=MediaType.MULTIPART_FORM_DATA_VALUE) @PreAuthorize("hasRole('ADMIN')")List<UsageView> bulk(@PathVariable long id,@RequestPart("file") MultipartFile file){return app.csv(id,file);}

  @PostMapping("/{id}/tariff-plans") @PreAuthorize("hasRole('ADMIN')")ResponseEntity<TariffPlanView> createPlan(@PathVariable long id, @Valid @RequestBody TariffPlanRequest r){return ResponseEntity.status(201).body(Views.plan(app.createPlan(id,r)));}
  @GetMapping("/{id}/tariff-plans") @PreAuthorize("hasAnyRole('ADMIN','RESIDENT')")List<TariffPlanView> getPlans(@PathVariable long id){return app.getPlans(id);}
  @PutMapping("/{id}/tariff-plans/{planId}") @PreAuthorize("hasRole('ADMIN')")TariffPlanView updatePlan(@PathVariable long id, @PathVariable long planId, @Valid @RequestBody TariffPlanRequest r){return Views.plan(app.updatePlan(id,planId,r));}

  @PostMapping("/{id}/billing-cycles") @PreAuthorize("hasRole('ADMIN')")ResponseEntity<BillingCycleView> createCycle(@PathVariable long id, @Valid @RequestBody BillingCycleRequest r){return ResponseEntity.status(201).body(Views.cycle(app.createCycle(id,r)));}
  @GetMapping("/{id}/billing-cycles") @PreAuthorize("hasAnyRole('ADMIN','RESIDENT')")List<BillingCycleView> getCycles(@PathVariable long id){return app.getCycles(id);}
}
@CrossOrigin(origins = "*")
@RestController @RequestMapping("/api/households") class HouseholdsController {
  final AppService app;HouseholdsController(AppService a){app=a;}
  @GetMapping("/{id}") @PreAuthorize("hasAnyRole('ADMIN','RESIDENT')")HouseholdView get(@PathVariable long id){return Views.household(app.household(id));}
  @PutMapping("/{id}") @PreAuthorize("hasRole('ADMIN')")HouseholdView put(@PathVariable long id,@Valid @RequestBody HouseholdRequest r){return Views.household(app.updateHousehold(id,r));}
  @PutMapping("/{id}/meter") @PreAuthorize("hasRole('ADMIN')")HouseholdView meter(@PathVariable long id,@RequestBody MeterRequest r){return Views.household(app.meter(id,r));}
  @PostMapping("/{id}/usage") @PreAuthorize("hasAnyRole('ADMIN','RESIDENT')")ResponseEntity<UsageView> usage(@PathVariable long id,@Valid @RequestBody UsageRequest r){return ResponseEntity.status(201).body(app.log(id,r,UsageSource.MANUAL));}
}
@CrossOrigin(origins = "*")
@RestController @RequestMapping("/api/billing-cycles") class BillingCyclesController {
  final AppService app;BillingCyclesController(AppService a){app=a;}
  @PostMapping("/{id}/purchases") @PreAuthorize("hasRole('ADMIN')")ResponseEntity<WaterPurchaseView> addPurchase(@PathVariable long id, @Valid @RequestBody WaterPurchaseRequest r){return ResponseEntity.status(201).body(Views.purchase(app.addPurchase(id,r)));}
  @GetMapping("/{id}/purchases") @PreAuthorize("hasAnyRole('ADMIN','RESIDENT')")List<WaterPurchaseView> getPurchases(@PathVariable long id){return app.getPurchases(id);}
  @PutMapping("/{id}/purchases/{purchaseId}") @PreAuthorize("hasRole('ADMIN')")WaterPurchaseView updatePurchase(@PathVariable long id, @PathVariable long purchaseId, @Valid @RequestBody WaterPurchaseRequest r){return Views.purchase(app.updatePurchase(id,purchaseId,r));}
  @DeleteMapping("/{id}/purchases/{purchaseId}") @PreAuthorize("hasRole('ADMIN')")ResponseEntity<Void> deletePurchase(@PathVariable long id, @PathVariable long purchaseId){app.deletePurchase(id,purchaseId); return ResponseEntity.noContent().build();}
  @PostMapping("/{id}/finalize") @PreAuthorize("hasRole('ADMIN')")List<InvoiceView> finalizeCycle(@PathVariable long id){return app.finalizeCycle(id);}
  @GetMapping("/{id}/invoices") @PreAuthorize("hasAnyRole('ADMIN','RESIDENT')")List<InvoiceView> getInvoices(@PathVariable long id){return app.getInvoices(id);}
  @PostMapping("/{id}/archive") @PreAuthorize("hasRole('ADMIN')")BillingCycleView archiveCycle(@PathVariable long id){return Views.cycle(app.archiveCycle(id));}
}
@CrossOrigin(origins = "*")
@RestController @RequestMapping("/api/alerts") class AlertsController {
  final AppService app;AlertsController(AppService a){app=a;}
  @GetMapping @PreAuthorize("hasAnyRole('ADMIN','RESIDENT')")List<AlertView> getAlerts(){return app.getAlerts();}
}
