import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import "./Productdistibution.css";
import { API_BASE_URL } from "../config/constants";

export default function ProductDistribution() {
  const { control, handleSubmit, watch, setValue, reset } = useForm();
  
  const [accountHeads, setAccountHeads] = useState([]);
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState([]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [headsRes, prodRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/accthead`),
          axios.get(`${API_BASE_URL}/products`)
        ]);
        setAccountHeads(headsRes.data);
        setProducts(prodRes.data);
      } catch (err) {
        toast.error("Failed to load initial data.");
      }
    };
    fetchData();
  }, []);

  const onSubmit = async (data) => {
    try {
      await axios.post(`${API_BASE_URL}/distribute`, {
        SenderId: 1, // Example ID from logged-in user
        ReceiverId: data.receiverAccountHead.value,
        ReceiverRole: data.receiverAccountHead.label,
        ProductName: data.product.label,
        DistributedQty: data.quantity,
        Remarks: data.remarks,
      });
      toast.success("Product distributed successfully!");
      reset();
    } catch (err) {
      toast.error("Distribution failed.");
    }
  };

  return (
    <div className="container mt-5">
      <ToastContainer />
      <div className="card shadow-lg border-0 rounded-10">
        <div className="card-header text-white" style={{ background: "#696cff" }}>
          <h3>Product Transfer Information</h3>
        </div>
        
        <div className="card-body">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="col-md-12 mt-4">
              <p className="PerInfo">Sender Information:</p>
            </div>
            
            <div className="row">
              <div className="col-md-4 mb-2">
                <label className="form-label-custom">Account Head</label>
                <Controller
                  name="senderAccountHead"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} options={accountHeads} placeholder="--Select Account Head--" />
                  )}
                />
              </div>
              {/* Add other fields here */}
            </div>

            <div className="col-md-12 mt-4">
              <p className="AddInfo">Receiver Information:</p>
            </div>

            <div className="row">
               <div className="col-md-6 mb-3">
                <label className="form-label-custom">Account Head</label>
                <Controller
                  name="receiverAccountHead"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} options={accountHeads} placeholder="--Select Account Head--" />
                  )}
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label-custom">Product Name</label>
                <Controller
                  name="product"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} options={products} placeholder="--Select Product--" />
                  )}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary">Submit Distribution</button>
          </form>
        </div>
      </div>
    </div>
  );
}