import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, firestore as db, auth } from "../../firebaseApp";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

interface WhatsappInsuranceOrder {
  adminFee: number;
  carBodyType: string;
  carImageUrl: string;
  chassis: string;
  creationDate: any; // Firebase Timestamp
  expiryDate: string;
  insuranceDocumentUrl: string;
  insuranceStartDate: string;
  insurer: string;
  licensedToCarryNo: string;
  markAndType: string;
  nationalIdDocumentUrl: string;
  nationalIdNames: string;
  nationalIdNumber: string;
  netPremium: number;
  numberOfCoveredPeople: number;
  plateNumber: string;
  policyNo: string;
  policyholderName: string;
  selectedCoverTypes: string;
  selectedInstallment: string;
  selectedPersonalAccidentCoverage: number;
  sgf: number;
  totalCost: number;
  usage: string;
  userPhone: string;
  vat: number;
  yellowCardDocumentUrl: string;
}

type OrderWithId = {
  id: string;
  data: WhatsappInsuranceOrder;
};

const Library = () => {
  const [orders, setOrders] = useState<OrderWithId[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithId | null>(null);
  const [loading, setLoading] = useState(false);

  // The upload form and related state have been left in for reference
  // but are not used in this example. You can remove them if not needed.
  const [newOrder, setNewOrder] = useState<Partial<WhatsappInsuranceOrder>>({});

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "whatsappInsuranceOrders"),
      (snapshot) => {
        setOrders(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            data: doc.data() as WhatsappInsuranceOrder,
          }))
        );
      }
    );
    return () => unsubscribe();
  }, []);

  const uploadFile = async (file: File, path: string) => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const handleAddOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert("Please sign in to add an order");
      return;
    }
    // You can add validations here if needed.
    setLoading(true);
    try {
      // Example: upload files and prepare your order data.
      // This example is kept minimal.
      const docRef = await addDoc(
        collection(db, "whatsappInsuranceOrders"),
        {
          ...newOrder,
          createdAt: serverTimestamp(),
        }
      );
      await updateDoc(docRef, { id: docRef.id });
      setNewOrder({});
    } catch (error) {
      console.error("Error adding order: ", error);
      alert("Failed to add order");
    }
    setLoading(false);
  };

  const handleDeleteOrder = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this order?")) return;
    try {
      await deleteDoc(doc(db, "whatsappInsuranceOrders", id));
    } catch (error) {
      console.error("Error deleting order: ", error);
      alert("Failed to delete order");
    }
  };

  // Helper to format a Timestamp into a readable date/time string
  const formatDate = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return "N/A";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(timestamp.toDate());
  };

  // Copy the provided text (URL) to the clipboard
  const handleCopy = (text: string | undefined) => {
    if (text) navigator.clipboard.writeText(text);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Client List</h3>

      {/* The upload form is optional. Uncomment if needed */}
      {/*
      <form onSubmit={handleAddOrder} className="mb-8 space-y-4">
        // ... your upload form fields here
        <button type="submit" disabled={loading}>
          {loading ? "Uploading..." : "Add Order"}
        </button>
      </form>
      */}

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4">Clients (Already used our service)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map(({ id, data }) => (
            <div
              key={id}
              onClick={() => setSelectedOrder({ id, data })}
              className="border rounded-lg p-4 hover:shadow-md transition duration-200 cursor-pointer"
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-lg">
                  {data.nationalIdNames || "N/A"}
                </h4>
                <span className="font-medium text-green-600">
                  RWF {data.totalCost || "N/A"}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Plate Number: {data.plateNumber || "N/A"}
              </p>
              <p className="text-sm text-gray-600">
                Insurer: {data.insurer || "N/A"}
              </p>
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={(e) => handleDeleteOrder(id, e)}
                  className="text-red-500 hover:text-red-700 font-medium transition duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dialog: Detailed table view for a selected order */}
      <Dialog
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Order Details #{selectedOrder?.data.policyNo || selectedOrder?.id}
        </DialogTitle>
        <DialogContent dividers>
          {selectedOrder && (
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
                <TableRow>
                  <TableCell>1</TableCell>
                  <TableCell>
                    {selectedOrder.data.nationalIdNames || "N/A"}
                  </TableCell>
                  <TableCell>
                    {selectedOrder.data.nationalIdNumber || "N/A"}
                  </TableCell>
                  <TableCell>
                    {selectedOrder.data.userPhone || "N/A"}
                  </TableCell>
                  <TableCell>{"N/A"}</TableCell>
                  <TableCell>
                    {selectedOrder.data.plateNumber || "N/A"}
                  </TableCell>
                  <TableCell>
                    {selectedOrder.data.markAndType || "N/A"}
                  </TableCell>
                  <TableCell>
                    {selectedOrder.data.chassis || "N/A"}
                  </TableCell>
                  <TableCell>
                    {selectedOrder.data.creationDate
                      ? new Date(selectedOrder.data.creationDate.seconds * 1000).getFullYear()
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {selectedOrder.data.licensedToCarryNo || "N/A"}
                  </TableCell>
                  <TableCell>{selectedOrder.data.usage || "N/A"}</TableCell>
                  <TableCell>
                    {selectedOrder.data.insurer || "N/A"}
                  </TableCell>
                  <TableCell>
                    {selectedOrder.data.insuranceStartDate || "N/A"}
                  </TableCell>
                  <TableCell>
                    {selectedOrder.data.expiryDate || "N/A"}
                  </TableCell>
                  <TableCell>
                    {selectedOrder.data.creationDate
                      ? formatDate(selectedOrder.data.creationDate)
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {selectedOrder.data.creationDate
                      ? formatDate(selectedOrder.data.creationDate)
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {selectedOrder.data.carBodyType || "N/A"}
                  </TableCell>
                  <TableCell>
                    {selectedOrder.data.selectedCoverTypes || "N/A"}
                  </TableCell>
                  <TableCell>{"N/A"}</TableCell>
                  <TableCell>
                    {selectedOrder.data.selectedPersonalAccidentCoverage ?? "N/A"}
                  </TableCell>
                  <TableCell>
                    {selectedOrder.data.selectedInstallment || "N/A"}
                  </TableCell>
                  <TableCell>{"N/A"}</TableCell>
                  <TableCell>{"N/A"}</TableCell>
                  <TableCell>
                    {selectedOrder.data.totalCost || "N/A"}
                  </TableCell>
                  <TableCell>{"N/A"}</TableCell>
                  <TableCell>
                    {selectedOrder.data.insuranceDocumentUrl ? (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() =>
                          handleCopy(selectedOrder.data.insuranceDocumentUrl)
                        }
                      >
                        Copy URL
                      </Button>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedOrder(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Library;


