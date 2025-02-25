import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  Timestamp
} from "firebase/firestore";
import { firestore as db } from "../../firebaseApp";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { getAuth } from "firebase/auth";

interface Order {
  id: string;
  // Fields from your firebase document – adjust as needed:
  policyholderName?: string;
  nationalIdNumber?: string;
  userPhone: string;
  tin?: string;
  plateNumber: string;
  markAndType: string;
  chassis: string;
  creationDate: Timestamp;
  licensedToCarryNo: string;
  usage: string;
  insurer: string;
  insuranceStartDate: string;
  expiryDate: string;
  carBodyType: string;
  selectedCoverTypes?: string;
  netPremium?: number;
  selectedPersonalAccidentCoverage: number;
  selectedInstallment?: string;
  policyNo: string;
  momoName?: string;
  totalCost: number;
  paidAmount?: number;
  // Document URLs:
  carImageUrl: string;
  insuranceDocumentUrl: string;
  nationalIdDocumentUrl: string;
  yellowCardDocumentUrl: string;
  status: string;
}

const currentOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentTab, setCurrentTab] = useState(0);
  const auth = getAuth();

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error("No user logged in");
      return;
    }
    // Define status based on the selected tab
    const statuses = ["processing", "completed", "cancelled"];
    const currentStatus = statuses[currentTab];

    const q = query(
      collection(db, "whatsappInsuranceOrders"),
      where("status", "==", currentStatus)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData: Order[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Order, "id">)
      }));
      setOrders(ordersData);
    });

    return () => unsubscribe();
  }, [currentTab, auth]);

  const handleTabChange = (_: any, newValue: number) => {
    setCurrentTab(newValue);
  };

  // Helper to format a Timestamp into a readable date/time string
  const formatDate = (timestamp: Timestamp) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(timestamp.toDate());
  };

  // Copy the provided text (here, the URL) to the clipboard
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="bg-white">
      <Tabs value={currentTab} onChange={handleTabChange} className="border-b">
        <Tab label="Processing" />
        <Tab label="Completed" />
        <Tab label="Cancelled" />
      </Tabs>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>No</TableCell>
            <TableCell>Full Name/ID</TableCell>
            <TableCell>ID Number</TableCell>
            <TableCell>Whatsapp Number</TableCell>
            <TableCell>TIN</TableCell>
            <TableCell>Plate Number</TableCell>
            <TableCell>Make/Model</TableCell>
            <TableCell>Chassis Number</TableCell>
            <TableCell>Year</TableCell>
            <TableCell>Licensed to Carry</TableCell>
            <TableCell>Usage</TableCell>
            <TableCell>Current Insurer</TableCell>
            <TableCell>Start Date</TableCell>
            <TableCell>End Date</TableCell>
            <TableCell>Time</TableCell>
            <TableCell>Issue Date</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Cover</TableCell>
            <TableCell>Personal Cover</TableCell>
            <TableCell>Personal Accident Cover</TableCell>
            <TableCell>Installments</TableCell>
            <TableCell>Proforma</TableCell>
            <TableCell>MOMO Name</TableCell>
            <TableCell>Total Premium</TableCell>
            <TableCell>PAID</TableCell>
            <TableCell>Insurance Certificate</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={26} align="center">
                No orders found
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order, index) => (
              <TableRow
                key={order.id}
                hover
                onClick={() => setSelectedOrder(order)}
                style={{ cursor: "pointer" }}
              >
                <TableCell>{index + 1}</TableCell>
                <TableCell>{order.policyholderName || "N/A"}</TableCell>
                <TableCell>{order.nationalIdNumber || "N/A"}</TableCell>
                <TableCell>{order.userPhone}</TableCell>
                <TableCell>{order.tin || "N/A"}</TableCell>
                <TableCell>{order.plateNumber}</TableCell>
                <TableCell>{order.markAndType}</TableCell>
                <TableCell>{order.chassis}</TableCell>
                <TableCell>
                  {order.creationDate
                    ? new Date(order.creationDate.seconds * 1000).getFullYear()
                    : "N/A"}
                </TableCell>
                <TableCell>{order.licensedToCarryNo}</TableCell>
                <TableCell>{order.usage}</TableCell>
                <TableCell>{order.insurer}</TableCell>
                <TableCell>{order.insuranceStartDate}</TableCell>
                <TableCell>{order.expiryDate}</TableCell>
                <TableCell>
                  {order.creationDate ? formatDate(order.creationDate) : "N/A"}
                </TableCell>
                <TableCell>
                  {order.creationDate ? formatDate(order.creationDate) : "N/A"}
                </TableCell>
                <TableCell>{order.carBodyType}</TableCell>
                <TableCell>{order.selectedCoverTypes || "N/A"}</TableCell>
                <TableCell>{order.netPremium ?? "N/A"}</TableCell>
                <TableCell>{order.selectedPersonalAccidentCoverage}</TableCell>
                <TableCell>{order.selectedInstallment || "N/A"}</TableCell>
                <TableCell>{order.policyNo}</TableCell>
                <TableCell>{order.momoName || "N/A"}</TableCell>
                <TableCell>{order.totalCost}</TableCell>
                <TableCell>{order.paidAmount ?? "N/A"}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOrder(order);
                    }}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Dialog for displaying the 4 images with copy buttons */}
      <Dialog
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Order Details #{selectedOrder?.policyNo || selectedOrder?.id}
        </DialogTitle>
        <DialogContent dividers>
          {selectedOrder && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "16px",
                justifyContent: "center"
              }}
            >
              {/* Car Image */}
              <div style={{ textAlign: "center" }}>
                <img
                  src={selectedOrder.carImageUrl}
                  alt="Car"
                  style={{ maxWidth: "200px" }}
                />
                <div>
                  <IconButton
                    onClick={() => handleCopy(selectedOrder.carImageUrl)}
                  >
                    <ContentCopyIcon />
                  </IconButton>
                </div>
              </div>
              {/* Insurance Document */}
              <div style={{ textAlign: "center" }}>
                <img
                  src={selectedOrder.insuranceDocumentUrl}
                  alt="Insurance Document"
                  style={{ maxWidth: "200px" }}
                />
                <div>
                  <IconButton
                    onClick={() =>
                      handleCopy(selectedOrder.insuranceDocumentUrl)
                    }
                  >
                    <ContentCopyIcon />
                  </IconButton>
                </div>
              </div>
              {/* National ID Document */}
              <div style={{ textAlign: "center" }}>
                <img
                  src={selectedOrder.nationalIdDocumentUrl}
                  alt="National ID"
                  style={{ maxWidth: "200px" }}
                />
                <div>
                  <IconButton
                    onClick={() =>
                      handleCopy(selectedOrder.nationalIdDocumentUrl)
                    }
                  >
                    <ContentCopyIcon />
                  </IconButton>
                </div>
              </div>
              {/* Yellow Card Document */}
              <div style={{ textAlign: "center" }}>
                <img
                  src={selectedOrder.yellowCardDocumentUrl}
                  alt="Yellow Card"
                  style={{ maxWidth: "200px" }}
                />
                <div>
                  <IconButton
                    onClick={() =>
                      handleCopy(selectedOrder.yellowCardDocumentUrl)
                    }
                  >
                    <ContentCopyIcon />
                  </IconButton>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedOrder(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default currentOrders;



// // Current Orders

// import { useState, useEffect } from "react";
// import {
//   collection,
//   query,
//   where,
//   onSnapshot,
//   doc,
//   updateDoc,
//   deleteDoc,
//   addDoc,
//   Timestamp,
// } from "firebase/firestore";
// import { firestore as db } from "../../firebaseApp";
// import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Tabs, Tab } from "@mui/material";
// import { getAuth } from "firebase/auth";

// interface BasketItem {
//   fold: boolean;
//   ironing: boolean;
//   name: string;
//   price: number;
//   quantity: number;
// }

// interface ShippingAddress {
//   addressString: string;
//   latitude: number;
//   longitude: number;
// }

// interface Order {
//   id: string;
//   baskets: BasketItem[];
//   createdAt: Timestamp;
//   deliveryDate: Timestamp;
//   pickupDate: Timestamp;
//   foldFees: number;
//   ironingFees: number;
//   orderId: string;
//   shippingAddress: ShippingAddress;
//   status: string;
//   totalAmount: number;
//   transportationFees: number;
//   userEmail: string;
//   userId: string;
// }

// const CurrentOrders = () => {
//   const [orders, setOrders] = useState<Order[]>([]);
//   const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
//   const [currentTab, setCurrentTab] = useState(0);
//   const auth = getAuth();

//   useEffect(() => {
//     const currentUser = auth.currentUser;
//     if (!currentUser) {
//       console.error("No user logged in");
//       return;
//     }

//     const statuses = ["processing", "completed", "cancelled"];
//     const currentStatus = statuses[currentTab];

//     const q = query(
//       collection(db, "whatsappInsuranceOrders"),
//       where("status", "==", currentStatus)
//     );

//     const unsubscribe = onSnapshot(q, (snapshot) => {
//       const ordersData: Order[] = snapshot.docs.map((doc) => ({
//         id: doc.id,
//         ...(doc.data() as Omit<Order, "id">),
//       }));
//       setOrders(ordersData);
//     });

//     return () => unsubscribe();
//   }, [currentTab]);

//   const handleUpdateStatus = async (order: Order, newStatus: string) => {
//     try {
//       const orderRef = doc(db, "whatsappOrdersGio", order.id);
//       await updateDoc(orderRef, {
//         status: newStatus,
//       });
//     } catch (error) {
//       console.error("Error updating order status:", error);
//     }
//   };

//   const handleTabChange = (_: any, newValue: number) => {
//     setCurrentTab(newValue);
//   };

//   const formatDate = (timestamp: Timestamp) => {
//     return new Intl.DateTimeFormat('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit',
//     }).format(timestamp.toDate());
//   };

//   const calculateSubtotal = (items: BasketItem[]) => {
//     return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
//   };

//   return (
//     <div className="bg-white">
//       <Tabs value={currentTab} onChange={handleTabChange} className="border-b">
//         <Tab label="Processing" />
//         <Tab label="Completed" />
//         <Tab label="Cancelled" />
//       </Tabs>

//       <div className="p-4">
//         {orders.length === 0 ? (
//           <div className="text-center py-8 text-gray-500">
//             No orders found
//           </div>
//         ) : (
//           orders.map((order) => (
//             <div key={order.id} className="bg-white rounded-lg shadow-md mb-4 p-4">
//               <div className="flex justify-between items-center mb-4">
//                 <div>
//                   <h3 className="font-semibold">Order #{order.orderId}</h3>
//                   <p className="text-sm text-gray-500">
//                     Created: {formatDate(order.createdAt)}
//                   </p>
//                 </div>
//                 <div className="text-right">
//                   <p className="text-sm text-gray-600">Total Amount</p>
//                   <p className="font-bold">RWF {order.totalAmount}</p>
//                 </div>
//               </div>

//               <div className="space-y-3 border-t border-b py-3 mb-4">
//                 <div className="flex justify-between">
//                   <span>Status</span>
//                   <span className="font-bold uppercase">{order.status}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span>Pickup Date</span>
//                   <span>{formatDate(order.pickupDate)}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span>Delivery Date</span>
//                   <span>{formatDate(order.deliveryDate)}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span>Delivery Address</span>
//                   <span>{order.shippingAddress.addressString}</span>
//                 </div>
//               </div>

//               <div className="flex justify-between space-x-4">
//                 <button
//                   onClick={() => setSelectedOrder(order)}
//                   className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
//                 >
//                   Order details
//                 </button>
//                 {order.status === "processing" && (
//                   <button
//                     onClick={() => handleUpdateStatus(order, "completed")}
//                     className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
//                   >
//                     Mark Completed
//                   </button>
//                 )}
//               </div>
//             </div>
//           ))
//         )}
//       </div>

//       <Dialog 
//         open={!!selectedOrder} 
//         onClose={() => setSelectedOrder(null)}
//         maxWidth="md"
//         fullWidth
//       >
//         <DialogTitle>Order Details #{selectedOrder?.orderId}</DialogTitle>
//         <DialogContent>
//           {selectedOrder && (
//             <div className="space-y-6 p-4">
//               <div>
//                 <h4 className="font-semibold mb-2">Customer Information</h4>
//                 <p>Email: {selectedOrder.userEmail}</p>
//                 <p>User ID: {selectedOrder.userId}</p>
//               </div>
              
//               <div>
//                 <h4 className="font-semibold mb-2">Items</h4>
//                 <div className="space-y-2">
//                   {selectedOrder.baskets.map((item, index) => (
//                     <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded">
//                       <div>
//                         <p className="font-medium">{item.name}</p>
//                         <p className="text-sm text-gray-600">
//                           Quantity: {item.quantity} | 
//                           Fold: {item.fold ? "Yes" : "No"} | 
//                           Iron: {item.ironing ? "Yes" : "No"}
//                         </p>
//                       </div>
//                       <p className="font-medium">RWF {item.price * item.quantity}</p>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               <div className="border-t pt-4">
//                 <h4 className="font-semibold mb-2">Price Breakdown</h4>
//                 <div className="space-y-2">
//                   <div className="flex justify-between">
//                     <span>Subtotal</span>
//                     <span>RWF {calculateSubtotal(selectedOrder.baskets)}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span>Folding Fees</span>
//                     <span>RWF {selectedOrder.foldFees}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span>Ironing Fees</span>
//                     <span>RWF {selectedOrder.ironingFees}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span>Transportation Fees</span>
//                     <span>RWF {selectedOrder.transportationFees}</span>
//                   </div>
//                   <div className="flex justify-between font-bold border-t pt-2">
//                     <span>Total Amount</span>
//                     <span>RWF {selectedOrder.totalAmount}</span>
//                   </div>
//                 </div>
//               </div>

//               <div>
//                 <h4 className="font-semibold mb-2">Delivery Information</h4>
//                 <p>Address: {selectedOrder.shippingAddress.addressString}</p>
//                 <p>Coordinates: {selectedOrder.shippingAddress.latitude}, {selectedOrder.shippingAddress.longitude}</p>
//                 <p>Pickup Date: {formatDate(selectedOrder.pickupDate)}</p>
//                 <p>Delivery Date: {formatDate(selectedOrder.deliveryDate)}</p>
//               </div>
//             </div>
//           )}
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setSelectedOrder(null)}>Close</Button>
//         </DialogActions>
//       </Dialog>
//     </div>
//   );
// };

// export default CurrentOrders;
