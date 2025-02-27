import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firestore as db, storage } from "../../firebaseApp";
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
  IconButton,
  Box,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  CircularProgress,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import SendIcon from "@mui/icons-material/Send";
import { getAuth } from "firebase/auth";

// Define your Order interface
interface Order {
  id: string;
  policyholderName?: string;
  nationalIdNames?: string;
  nationalIdNumber?: string;
  userPhone: string;
  yellowCardTin?: string;
  yellowCardImmatriculation?: string;
  yellowCardChassis?: string;
  yellowCardAnnee?: string;
  plateNumber: string;
  markAndType: string;
  chassis: string;
  creationDate: Timestamp;
  licensedToCarryNo: string;
  usage: string;
  insurer: string;
  insuranceStartDate?: string;
  insuranceEndDate?: string;
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
  paidBool: boolean;
  carImageUrl: string;
  insuranceDocumentUrl: string;
  nationalIdDocumentUrl: string;
  yellowCardDocumentUrl: string;
  status: string;
  // Additional fields for our custom cells:
  timeValue?: string;
  issueDate?: string;
  // Fields to hold the uploaded file URLs:
  uploadedProformaUrl?: string;
  uploadedInsuranceCertificateUrl?: string;
}

// Helper to update a field in Firestore immediately
const updateField = async (orderId: string, field: string, value: any) => {
  try {
    const docRef = doc(db, "whatsappInsuranceOrders", orderId);
    await updateDoc(docRef, { [field]: value });
    console.log(`Updated ${field} for order ${orderId} to ${value}`);
  } catch (err) {
    console.error(`Error updating ${field} for order ${orderId}:`, err);
  }
};

// Custom component for the Proforma cell
const ProformaCell = ({
  order,
  updateField,
}: {
  order: Order;
  updateField: any;
}) => {
  const [attachedFile, setAttachedFile] = useState<string | null>(
    order.uploadedProformaUrl || null
  );
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setUploading(true);
      try {
        // Create a reference to the storage location
        const storageRef = ref(storage, `proformas/${order.id}/${file.name}`);

        // Upload the file
        const snapshot = await uploadBytes(storageRef, file);

        // Get the download URL
        const downloadURL = await getDownloadURL(snapshot.ref);

        // Update the field in Firestore
        await updateField(order.id, "uploadedProformaUrl", downloadURL);

        // Update local state
        setAttachedFile(downloadURL);
      } catch (error) {
        console.error("Error uploading proforma:", error);
        alert("Failed to upload file. Please try again.");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSend = async () => {
    // Here you would call your send API which uses the attachedFile URL
    console.log("Sending proforma using URL:", attachedFile);
    try {
      const response = await fetch(
        "https://assigurwmessaging.onrender.com/api/send-proforma",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.id,
            proformaUrl: attachedFile,
            sendDocumentFirst: true,
          }),
        }
      );
      const data = await response.json();
      if (data.success) {
        console.log("Proforma sent successfully");

        // Update order status to "proforma" if current status is "processing"
        if (order.status === "processing") {
          await updateField(order.id, "status", "proforma");
        }

        alert("Proforma sent successfully");
      } else {
        console.error("Failed to send proforma:", data.message);
        alert(`Failed to send proforma: ${data.message}`);
      }
    } catch (error) {
      console.error("Error sending proforma:", error);
      alert("Error sending proforma. Please try again.");
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {uploading ? (
        <CircularProgress size={24} />
      ) : attachedFile ? (
        <>
          <a
            href={attachedFile}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              marginRight: "8px",
              maxWidth: "150px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            View File
          </a>
          <IconButton onClick={handleSend} color="primary">
            <SendIcon />
          </IconButton>
        </>
      ) : (
        <div>
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
            id={`proforma-file-${order.id}`}
          />
          <label htmlFor={`proforma-file-${order.id}`}>
            <IconButton component="span" color="primary">
              <AttachFileIcon />
            </IconButton>
          </label>
        </div>
      )}
    </div>
  );
};


// Custom component for the Insurance Certificate cell
const InsuranceCertificateCell = ({
  order,
  updateField,
}: {
  order: Order;
  updateField: any;
}) => {
  const [attachedFile, setAttachedFile] = useState<string | null>(
    order.uploadedInsuranceCertificateUrl || null
  );
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setUploading(true);
      try {
        // Create a reference to the storage location
        const storageRef = ref(
          storage,
          `certificates/${order.id}/${file.name}`
        );

        // Upload the file
        const snapshot = await uploadBytes(storageRef, file);

        // Get the download URL
        const downloadURL = await getDownloadURL(snapshot.ref);

        // Update the field in Firestore
        await updateField(
          order.id,
          "uploadedInsuranceCertificateUrl",
          downloadURL
        );

        // Update local state
        setAttachedFile(downloadURL);
      } catch (error) {
        console.error("Error uploading insurance certificate:", error);
        alert("Failed to upload file. Please try again.");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSend = async () => {
    console.log("Sending insurance certificate using URL:", attachedFile);
    try {
      const response = await fetch(
        "https://assigurwmessaging.onrender.com/api/mark-as-paid",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.id,
            certificateUrl: attachedFile,
          }),
        }
      );
      const data = await response.json();
      if (data.success) {
        console.log("Insurance certificate sent successfully");
        
        // Update order status to "completed" if needed
        if (order.status !== "completed") {
          await updateField(order.id, "status", "completed");
        }
        
        alert("Insurance certificate sent successfully");
      } else {
        console.error("Failed to send certificate:", data.message);
        alert(`Failed to send certificate: ${data.message}`);
      }
    } catch (error) {
      console.error("Error sending certificate:", error);
      alert("Error sending certificate. Please try again.");
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {uploading ? (
        <CircularProgress size={24} />
      ) : attachedFile ? (
        <>
          <a
            href={attachedFile}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              marginRight: "8px",
              maxWidth: "150px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            View File
          </a>
          <IconButton onClick={handleSend} color="primary">
            <SendIcon />
          </IconButton>
        </>
      ) : (
        <div>
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
            id={`certificate-file-${order.id}`}
          />
          <label htmlFor={`certificate-file-${order.id}`}>
            <IconButton component="span" color="primary">
              <AttachFileIcon />
            </IconButton>
          </label>
        </div>
      )}
    </div>
  );
};



// Custom component for the Insurance Certificate cell old 
const InsuranceCertificateCellOld = ({
  order,
  updateField,
}: {
  order: Order;
  updateField: any;
}) => {
  const [attachedFile, setAttachedFile] = useState<string | null>(
    order.uploadedInsuranceCertificateUrl || null
  );
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setUploading(true);
      try {
        // Create a reference to the storage location
        const storageRef = ref(
          storage,
          `certificates/${order.id}/${file.name}`
        );

        // Upload the file
        const snapshot = await uploadBytes(storageRef, file);

        // Get the download URL
        const downloadURL = await getDownloadURL(snapshot.ref);

        // Update the field in Firestore
        await updateField(
          order.id,
          "uploadedInsuranceCertificateUrl",
          downloadURL
        );

        // Update local state
        setAttachedFile(downloadURL);
      } catch (error) {
        console.error("Error uploading insurance certificate:", error);
        alert("Failed to upload file. Please try again.");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSend = async () => {
    console.log("Sending insurance certificate using URL:", attachedFile);
    try {
      const response = await fetch(
        "https://assigurwmessaging.onrender.com/api/send-insurance-certificate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.id,
            certificateUrl: attachedFile,
          }),
        }
      );
      const data = await response.json();
      if (data.success) {
        console.log("Insurance certificate sent successfully");
        alert("Insurance certificate sent successfully");
      } else {
        console.error("Failed to send certificate:", data.message);
        alert(`Failed to send certificate: ${data.message}`);
      }
    } catch (error) {
      console.error("Error sending certificate:", error);
      alert("Error sending certificate. Please try again.");
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {uploading ? (
        <CircularProgress size={24} />
      ) : attachedFile ? (
        <>
          <a
            href={attachedFile}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              marginRight: "8px",
              maxWidth: "150px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            View File
          </a>
          <IconButton onClick={handleSend} color="primary">
            <SendIcon />
          </IconButton>
        </>
      ) : (
        <div>
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
            id={`certificate-file-${order.id}`}
          />
          <label htmlFor={`certificate-file-${order.id}`}>
            <IconButton component="span" color="primary">
              <AttachFileIcon />
            </IconButton>
          </label>
        </div>
      )}
    </div>
  );
};



const CurrentOrders = () => {
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [enlargedImageTitle, setEnlargedImageTitle] = useState<string>("");

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentTab, setCurrentTab] = useState(0);
  const auth = getAuth();

  const handleImageClick = (imageUrl: string, title: string) => {
    setEnlargedImage(imageUrl);
    setEnlargedImageTitle(title);
  };

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error("No user logged in");
      return;
    }
    const statuses = ["processing", "proforma", "completed", "cancelled"];
    const currentStatus = statuses[currentTab];

    const q = query(
      collection(db, "whatsappInsuranceOrders"),
      where("status", "==", currentStatus)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData: Order[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Order, "id">),
      }));
      setOrders(ordersData);
    });

    return () => unsubscribe();
  }, [currentTab, auth]);

  const handleTabChange = (_: any, newValue: number) => {
    setCurrentTab(newValue);
  };

  // Format a timestamp to display only date (no time)
  const formatDate = (timestamp: Timestamp) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(timestamp.toDate());
  };

  // With time
  const formattDate = (timestamp: Timestamp) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(timestamp.toDate());
  };

  // Simple copy-to-clipboard helper
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Function to send proforma (calls API which now uses the uploaded document URL)
  const handleSendProforma = async () => {
    if (!selectedOrder) return;
    try {
      const response = await fetch(
        "https://assigurwmessaging.onrender.com/api/send-proforma",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: selectedOrder.id }),
        }
      );
      const data = await response.json();
      if (data.success) {
        console.log("Proforma sent successfully");
        setSelectedOrder(null);
      } else {
        console.error("Failed to send proforma:", data.message);
      }
    } catch (error) {
      console.error("Error sending proforma:", error);
    }
  };

  // Function to mark order as paid
  const handleMarkAsPaid = async () => {
    if (!selectedOrder) return;
    try {
      const response = await fetch(
        "https://assigurwmessaging.onrender.com/api/mark-as-paid",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: selectedOrder.id }),
        }
      );
      const data = await response.json();
      if (data.success) {
        console.log("Payment processed successfully");
        setSelectedOrder(null);
      } else {
        console.error("Failed to process payment:", data.message);
      }
    } catch (error) {
      console.error("Error processing payment:", error);
    }
  };

  return (
    <div className="bg-white overflow-x-hidden">
      <Tabs value={currentTab} onChange={handleTabChange} className="border-b">
        <Tab label="Processing" />
        <Tab label="Proforma" />
        <Tab label="Completed" />
        <Tab label="Cancelled" />
      </Tabs>
      <Box sx={{ overflow: "auto" }}>
        {/* sx={{ minWidth: 2500 }} */}
        <Table sx={{ maxWidth: 2500 }}>
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
              {/* <TableCell>Personal Cover</TableCell>
              <TableCell>Personal Accident Cover</TableCell>
              <TableCell>Installments</TableCell> */}
              <TableCell>Proforma</TableCell>
              {/* <TableCell>MOMO Name</TableCell> */}
              <TableCell>Total Premium</TableCell>
              <TableCell>PAID</TableCell>
              <TableCell>Creation Date</TableCell>
              <TableCell>Insurance Certificate</TableCell>
              <TableCell>View</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={27} align="center">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order, index) => (
                <TableRow key={order.id} hover>
                  <TableCell
                    className="cursor-pointer"
                    onClick={() => handleCopy(String(index + 1))}
                  >
                    {index + 1}
                  </TableCell>
                  <TableCell
                    onClick={() => handleCopy(order.nationalIdNames || "N/A")}
                  >
                    {order.nationalIdNames || "N/A"}
                  </TableCell>
                  <TableCell
                    onClick={() => handleCopy(order.nationalIdNumber || "N/A")}
                  >
                    {order.nationalIdNumber || "N/A"}
                  </TableCell>
                  <TableCell onClick={() => handleCopy(order.userPhone)}>
                    {order.userPhone}
                  </TableCell>
                  <TableCell
                    onClick={() => handleCopy(order.yellowCardTin || "N/A")}
                  >
                    {order.yellowCardTin || "N/A"}
                  </TableCell>
                  <TableCell
                    onClick={() =>
                      handleCopy(order.yellowCardImmatriculation || "N/A")
                    }
                  >
                    {order.yellowCardImmatriculation}
                  </TableCell>
                  <TableCell onClick={() => handleCopy(order.markAndType)}>
                    {order.markAndType}
                  </TableCell>
                  <TableCell
                    onClick={() => handleCopy(order.yellowCardChassis || "N/A")}
                  >
                    {order.yellowCardChassis}
                  </TableCell>
                  <TableCell
                    onClick={() => handleCopy(order.yellowCardAnnee || "N/A")}
                  >
                    {order.yellowCardAnnee}
                  </TableCell>
                  {/* <TableCell onClick={() => handleCopy(
                    order.creationDate ? new Date(order.creationDate.seconds * 1000).getFullYear().toString() : "N/A"
                  )}>
                    {order.creationDate ? new Date(order.creationDate.seconds * 1000).getFullYear() : "N/A"}
                  </TableCell> */}
                  {/* Licensed to Carry - editable input */}
                  <TableCell>
                    <TextField
                      type="number"
                      value={order.licensedToCarryNo}
                      onChange={(e) =>
                        updateField(
                          order.id,
                          "licensedToCarryNo",
                          e.target.value
                        )
                      }
                    />
                  </TableCell>
                  {/* Usage - dropdown */}
                  <TableCell>
                    <FormControl fullWidth>
                      <InputLabel>Usage</InputLabel>
                      <Select
                        value={order.usage}
                        label="Usage"
                        onChange={(e) =>
                          updateField(order.id, "usage", e.target.value)
                        }
                      >
                        <MenuItem value="Private">Private</MenuItem>
                        <MenuItem value="Commercial">Commercial</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell onClick={() => handleCopy(order.insurer)}>
                    {order.insurer}
                  </TableCell>
                  <TableCell
                    onClick={() =>
                      handleCopy(order.insuranceStartDate || "N/A")
                    }
                  >
                    {order.insuranceStartDate}
                  </TableCell>
                  <TableCell
                    onClick={() => handleCopy(order.insuranceEndDate || "N/A")}
                  >
                    {order.insuranceEndDate}
                  </TableCell>
                  {/* Time - time picker */}
                  <TableCell>
                    <input
                      type="time"
                      value={order.timeValue || ""}
                      onChange={(e) =>
                        updateField(order.id, "timeValue", e.target.value)
                      }
                    />
                  </TableCell>
                  {/* Issue Date - date picker */}
                  <TableCell>
                    <input
                      type="date"
                      value={order.issueDate || ""}
                      onChange={(e) =>
                        updateField(order.id, "issueDate", e.target.value)
                      }
                    />
                  </TableCell>
                  {/* Type - dropdown */}
                  <TableCell>
                    <FormControl fullWidth>
                      <InputLabel>Type</InputLabel>
                      <Select
                        value={order.carBodyType}
                        label="Type"
                        onChange={(e) =>
                          updateField(order.id, "carBodyType", e.target.value)
                        }
                      >
                        <MenuItem value="Sedan">Sedan</MenuItem>
                        <MenuItem value="SUV">SUV</MenuItem>
                        <MenuItem value="Pickup">Pickup</MenuItem>
                        <MenuItem value="Minibus">Minibus</MenuItem>
                        <MenuItem value="Truck">Truck</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell
                    onClick={() =>
                      handleCopy(order.selectedCoverTypes || "N/A")
                    }
                  >
                    {order.selectedCoverTypes
                      ? order.selectedCoverTypes.split("_")[1]
                      : "N/A"}
                  </TableCell>
                  {/* <TableCell
                    onClick={() =>
                      handleCopy(String(order.netPremium ?? "N/A"))
                    }
                  >
                    {order.netPremium ?? "N/A"}
                  </TableCell>
                  <TableCell
                    onClick={() =>
                      handleCopy(String(order.selectedPersonalAccidentCoverage))
                    }
                  >
                    {order.selectedPersonalAccidentCoverage}
                  </TableCell>
                  <TableCell
                    onClick={() =>
                      handleCopy(order.selectedInstallment || "N/A")
                    }
                  >
                    {order.selectedInstallment || "N/A"}
                  </TableCell> */}
                  {/* Proforma - custom cell */}
                  <TableCell>
                    <ProformaCell order={order} updateField={updateField} />
                  </TableCell>
                  {/* <TableCell
                    onClick={() => handleCopy(order.momoName || "N/A")}
                  >
                    {order.momoName || "N/A"}
                  </TableCell> */}
                  <TableCell
                    onClick={() => handleCopy(String(order.totalCost))}
                  >
                    {order.totalCost}
                  </TableCell>
                  <TableCell
                    onClick={() => handleCopy(order.paidBool ? "Paid" : "No")}
                  >
                    {order.paidBool ? "Paid" : "No"}
                  </TableCell>
                  <TableCell
                    onClick={() =>
                      handleCopy(
                        String(
                          order.creationDate
                            ? formattDate(order.creationDate)
                            : "N/A"
                        )
                      )
                    }
                  >
                    {order.creationDate
                      ? formattDate(order.creationDate)
                      : "N/A"}
                  </TableCell>
                  {/* Insurance Certificate - custom cell */}
                  <TableCell>
                    <InsuranceCertificateCell
                      order={order}
                      updateField={updateField}
                    />
                  </TableCell>
                  {/* View button to open dialog */}
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
      </Box>
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
                justifyContent: "center",
              }}
            >
              {/* Car Image */}
              <div style={{ textAlign: "center" }}>
                <img
                  src={selectedOrder.carImageUrl}
                  alt="Car"
                  style={{ maxWidth: "200px", cursor: "pointer" }}
                  onClick={() =>
                    handleImageClick(selectedOrder.carImageUrl, "Car Image")
                  }
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
                  style={{ maxWidth: "200px", cursor: "pointer" }}
                  onClick={() =>
                    handleImageClick(
                      selectedOrder.insuranceDocumentUrl,
                      "Insurance Document"
                    )
                  }
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
                  style={{ maxWidth: "200px", cursor: "pointer" }}
                  onClick={() =>
                    handleImageClick(
                      selectedOrder.nationalIdDocumentUrl,
                      "National ID"
                    )
                  }
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
                  style={{ maxWidth: "200px", cursor: "pointer" }}
                  onClick={() =>
                    handleImageClick(
                      selectedOrder.yellowCardDocumentUrl,
                      "Yellow Card"
                    )
                  }
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
          {/* {selectedOrder && selectedOrder.status === "processing" && (
            <Button
              onClick={handleSendProforma}
              variant="contained"
              color="primary"
            >
              Send Proforma
            </Button>
         )} */}
          {/* {selectedOrder && selectedOrder.status === "proforma" && (
            <Button
              onClick={handleMarkAsPaid}
              variant="contained"
              color="success"
            >
              Send Certificate
            </Button>
          )} */}
        </DialogActions>
      </Dialog>
      {/* Image Enlargement Dialog */}
      <Dialog
        open={!!enlargedImage}
        onClose={() => setEnlargedImage(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>{enlargedImageTitle}</DialogTitle>
        <DialogContent>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
            }}
          >
            {enlargedImage && (
              <img
                src={enlargedImage}
                alt={enlargedImageTitle}
                style={{ maxWidth: "100%", maxHeight: "80vh" }}
              />
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEnlargedImage(null)}>Close</Button>
          <Button
            onClick={() => enlargedImage && handleCopy(enlargedImage)}
            startIcon={<ContentCopyIcon />}
          >
            Copy URL
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CurrentOrders;
