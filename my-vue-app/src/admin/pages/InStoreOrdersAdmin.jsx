import React, { useEffect, useState } from "react";
import axios from "axios";
// غير ضرورية سنغيرع ا الى صفحة ستاتيتيك للمحل

function InStoreOrdersAdmin() {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      const res = await axios.get("https://khmiri-resto.onrender.com/api/orders/in-store");
      setOrders(res.data);
    } catch (err) {
      alert("فشل في تحميل الطلبات");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const markAsDelivered = async (id) => {
    try {
      await axios.put(`https://khmiri-resto.onrender.com/api/order/${id}`, {
        status: "delivered",
      });
      fetchOrders();
    } catch (err) {
      alert("فشل في تحديث الحالة");
    }
  };

  const deleteOrder = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف الطلب؟")) return;
    try {
      await axios.delete(`https://khmiri-resto.onrender.com/api/order/${id}`);
      fetchOrders();
    } catch (err) {
      alert("فشل في حذف الطلب");
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">طلبات داخل المحل</h2>
      {orders.length === 0 ? (
        <p className="text-center">لا توجد طلبات.</p>
      ) : (
        <table className="table table-bordered">
          <thead className="table-dark">
            <tr>
              <th>رقم الانتظار</th>
              <th>المنتجات</th>
              <th>المجموعات</th>
              <th>الحالة</th>
              <th>خيارات</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td>{order.queueNumber || "?"}</td>
                <td>
                  {order.products.map((p, i) => (
                    <div key={i}>
                      {p.product?.name || "?"} × {p.quantity}
                    </div>
                  ))}
                </td>
                <td>
                  {order.productGroups.map((g, i) => (
                    <div key={i}>
                      {g.group?.name || "?"} × {g.quantity}
                    </div>
                  ))}
                </td>
                <td>
                  <span
                    className={`badge ${
                      order.status === "delivered" ? "bg-success" : "bg-warning"
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
                <td>
                  {order.status !== "delivered" && (
                    <button
                      className="btn btn-sm btn-primary me-2"
                      onClick={() => markAsDelivered(order._id)}
                    >
                      تم التسليم
                    </button>
                  )}
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => deleteOrder(order._id)}
                  >
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default InStoreOrdersAdmin;
