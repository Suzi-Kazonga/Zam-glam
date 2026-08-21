export default function CourierInfo({ delivery }) {
  if (!delivery) {
    return null;
  }

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <h3 className="font-bold text-lg mb-3">Courier Information</h3>
      <div className="space-y-2 text-sm text-gray-700">
        <p><span className="font-semibold">Driver:</span> {delivery.driver_name}</p>
        <p><span className="font-semibold">Price:</span> K{Number(delivery.price).toFixed(2)}</p>
        <p><span className="font-semibold">Distance:</span> {delivery.distance}</p>
        <p><span className="font-semibold">Direction:</span> {delivery.direction}</p>
      </div>
    </div>
  );
}
