import { SubmissionContent } from '../types/lld';

export const STARTER_TEMPLATES: Record<string, SubmissionContent> = {
  'parking-lot': {
    requirements: `1. Support multiple floors and vehicle types (Car, Motorcycle, Truck)
2. Automated entry and exit ticketing with duration-based fee calculation
3. Nearest available spot allocation algorithm
4. Concurrency control for simultaneous spot reservations
5. Real-time floor occupancy display`,
    classes: `1. class ParkingLot
2. class ParkingFloor
3. abstract class ParkingSpot
4. class CompactSpot extends ParkingSpot
5. class LargeSpot extends ParkingSpot
6. class MotorcycleSpot extends ParkingSpot
7. interface ParkingStrategy
8. class NearestFirstStrategy implements ParkingStrategy
9. class Ticket
10. class Vehicle
11. enum VehicleType { MOTORCYCLE, CAR, TRUCK }
12. enum SpotStatus { AVAILABLE, OCCUPIED, RESERVED }`,
    responsibilities: `1. ParkingLot: Central coordinator singleton managing floors, entry/exit gates, and payment gateways.
2. ParkingFloor: Tracks localized spot occupancy, floor display boards, and floor-level locks.
3. ParkingSpot: Encapsulates spot number, size compatibility, and assignment state.
4. ParkingStrategy: Pluggable algorithm interface to determine the optimal spot for incoming vehicles.
5. Ticket: Holds license plate, entrance timestamp, assigned spot ID, and payment status.`,
    relationships: `1. ParkingLot HAS-A ParkingFloor (1-to-many composition)
2. ParkingFloor HAS-A ParkingSpot (1-to-many composition)
3. CompactSpot, LargeSpot, MotorcycleSpot EXTEND ParkingSpot (IS-A inheritance)
4. ParkingLot USES ParkingStrategy (Strategy Pattern for spot allocation)
5. Ticket ASSOCIATES WITH Vehicle and ParkingSpot`,
    decisions: `1. Strategy Pattern for spot allocation: Decouples finding spots from parking lot orchestration, allowing future pricing-based or VIP allocation.
2. Factory Pattern for Vehicle and Spot creation: Ensures spots match vehicle dimensions cleanly without type-checking if/else blocks.
3. Thread Safety: ReentrantLock / synchronized block per floor rather than a global parking lot lock to maximize entry throughput.`,
    edgeCases: `1. Lot Full: Early rejection at entry terminal without issuing ticket.
2. Race Condition: Concurrent drivers aiming for the same spot resolved via atomic CAS or synchronized spot reservation.
3. Vehicle Size Mismatch: Guard clauses ensure trucks cannot occupy compact spots.
4. Lost Ticket: Fallback procedure to charge maximum daily rate.`,
  },

  'elevator-system': {
    requirements: `1. Support multiple elevator cars servicing N floors
2. Minimize passenger wait time and energy consumption using scheduling algorithms
3. Handle internal car requests (destination floor) and external lobby requests (up/down)
4. Safety systems: weight limits, emergency stops, fire alarm override mode`,
    classes: `1. class ElevatorController
2. class ElevatorCar
3. interface SchedulingStrategy
4. class LookScanStrategy implements SchedulingStrategy
5. class Request
6. enum Direction { UP, DOWN, IDLE }
7. enum ElevatorState { MOVING, STOPPED, MAINTENANCE, EMERGENCY }
8. class Door
9. class ButtonPanel`,
    responsibilities: `1. ElevatorController: Dispatches hall requests to the best available elevator car using scheduling strategy.
2. ElevatorCar: Manages motor movement, current floor state, door control, and internal floor queue.
3. SchedulingStrategy: Determines target order (e.g. SCAN/LOOK algorithm to prevent starvation).
4. Door: Handles open/close safety sensors and obstruction detection.`,
    relationships: `1. ElevatorController HAS-A ElevatorCar (1-to-many composition)
2. ElevatorController USES SchedulingStrategy (Strategy Pattern)
3. ElevatorCar HAS-A Door, ButtonPanel (Composition)
4. Request ASSOCIATES WITH ElevatorCar`,
    decisions: `1. State Pattern for Elevator states (MovingUp, MovingDown, Idle, Maintenance) to avoid deeply nested conditional logic.
2. LOOK Algorithm: Elevator continues in current direction servicing requests until none remain ahead, then reverses direction.
3. Event-driven notifications: Hall displays observe ElevatorCar state updates.`,
    edgeCases: `1. Fire alarm triggered: All elevators immediately bypass passenger requests, descend to ground floor, open doors, and lock in Emergency state.
2. Overweight alarm: Sensor prevents doors from closing until weight drops below threshold.
3. Conflicting requests: Elevator prioritizes passengers already inside over new hall calls.`,
  },

  'vending-machine': {
    requirements: `1. Support multiple product items with dynamic inventory and pricing
2. Accept multiple payment methods (Coins, Cash, Card, UPI)
3. State machine for product selection, payment insertion, dispensing, and change calculation
4. Handle out-of-stock and invalid denomination scenarios`,
    classes: `1. class VendingMachine
2. interface MachineState
3. class IdleState implements MachineState
4. class HasMoneyState implements MachineState
5. class DispensingState implements MachineState
6. class Inventory
7. class Item
8. class CoinSlot
9. interface PaymentMethod
10. class CashPayment implements PaymentMethod
11. class CardPayment implements PaymentMethod`,
    responsibilities: `1. VendingMachine: Context class maintaining state machine and delegates actions.
2. MachineState: Interface defining insertMoney(), selectProduct(), dispense(), and cancel().
3. Inventory: Tracks item counts, shelf slots, and low-stock alerts.
4. PaymentMethod: Handles payment validation, authorization, and change computation.`,
    relationships: `1. VendingMachine HAS-A MachineState (State Pattern)
2. VendingMachine HAS-A Inventory (Composition)
3. VendingMachine USES PaymentMethod (Strategy Pattern)
4. Inventory HAS-A Item (Aggregation)`,
    decisions: `1. State Pattern: Cleanly separates states (Idle -> HasMoney -> Dispensing -> Refund) without fragile flag variables.
2. Strategy Pattern for payments: Allows adding digital wallets (Google Pay, Apple Pay) without altering dispensing logic.
3. Exact change computation: Greedy algorithm with fallback to reject cash if exact change is unavailable.`,
    edgeCases: `1. Insufficient money inserted: Machine prompts for balance or allows cancellation with full refund.
2. Item stuck in dispenser: Optical sensor detects non-drop, refunds user, and transitions item slot to Maintenance.
3. Concurrent coin insertion: Thread-safe queue for coin acceptance.`,
  },

  'library-management': {
    requirements: `1. Catalog management: search books by title, author, category, or ISBN
2. Book lending: checkout, return, renewal, and overdue fine calculation
3. Member accounts with active loan limits and subscription tier verification
4. Book reservations when all physical copies are loaned out`,
    classes: `1. class LibrarySystem
2. class Book
3. class BookCopy
4. class Member
5. class LoanRecord
6. interface SearchStrategy
7. class TitleSearchStrategy implements SearchStrategy
8. class FineCalculator
9. class ReservationQueue`,
    responsibilities: `1. LibrarySystem: Central coordinator managing catalog, loans, and member registries.
2. Book & BookCopy: Book holds metadata; BookCopy holds barcode, condition, and loan status.
3. Member: Tracks checked out copies, reservation history, and unpaid fines.
4. LoanRecord: Tracks checkout date, due date, return date, and calculated overdue penalties.`,
    relationships: `1. Book HAS-A BookCopy (1-to-many composition)
2. LibrarySystem HAS-A Book, Member, LoanRecord (Composition)
3. LibrarySystem USES SearchStrategy (Strategy Pattern)
4. BookCopy HAS-A ReservationQueue (Composition)`,
    decisions: `1. Separation between Book and BookCopy: Enables having 10 physical copies with individual barcode IDs under 1 catalog metadata entry.
2. Observer Pattern for Reservations: When a book copy is returned, the next member in the ReservationQueue is automatically notified.
3. Strategy Pattern for search: Pluggable indexing for Title, Author, Category, or Full-Text search.`,
    edgeCases: `1. Member fine threshold exceeded: Checkout blocked until outstanding dues are settled.
2. Book returned after due date: Grace period considered, then fine computed per day overdue.
3. Reservation expiration: If a reserved book is not collected within 48 hours, it automatically passes to the next member.`,
  },
};
