const Parcel = require("../models/Parcel");

exports.createParcel = async (parcelData) => {
  const parcel = new Parcel(parcelData);
  return await parcel.save();
};