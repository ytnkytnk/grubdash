const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

////////////////////////////////////////////////
// helper function                            //
////////////////////////////////////////////////

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    next();
  }
  next({
    status: 404,
    message: `Order not found: ${orderId}`,
  });
}

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;

    if (data[propertyName]) {
      return next();
    }
    next({
      status: 400,
      message: `Order must include a ${propertyName}`,
    });
  };
}

function isDishValidArray(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (Array.isArray(dishes) && dishes.length > 0) {
    next();
  }
  next({
    status: 400,
    message: `Order must include at least one dish`,
  });
}

function isDishQuantityValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  for (let i = 0; i < dishes.length; i++) {
    const dish = dishes[i];
    const quantity = dish.quantity;
    // console.log("------------------------");
    // console.log("dish quantity: ", quantity);

    if (
      quantity === undefined ||
      quantity <= 0 ||
      !Number.isInteger(quantity)
    ) {
      return next({
        status: 400,
        message: `dish ${i} must have a quantity that is an integer greater than 0`,
      });
    }
  }

  next();
}

function statusExists(req, res, next) {
  const { data: { status } = {} } = req.body;
  if (
    status &&
    (status == "pending" ||
      status == "preparing" ||
      status == "out-for-delivery" ||
      status == "delivered")
  ) {
    next();
  }
  next({
    status: 400,
    message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
  });
}

function isOrderStatusPending(req, res, next) {
  const order = res.locals.order;
  if (order.status === "pending") {
    next();
  }
  next({
    status: 400,
    message: `An order cannot be deleted unless it is pending.`,
  });
}

function isOrderIdMatchesRouteId(req, res, next) {
  const order = res.locals.order;
  const orderId = order.id;

  const { data: { id } = {} } = req.body;

  //   // for debugging
  //   console.log("----------------------");
  //   console.log("orderId:", orderId, "id: ", id);

  if (!id || orderId === id) {
    // console.log("=== true ===");
    next();
  }
  //   console.log("=== false ===");
  next({
    status: 400,
    message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
  });
}

////////////////////////////////////////////////
// main function                              //
////////////////////////////////////////////////

function list(req, res, next) {
  res.json({ data: orders });
}

function read(req, res, next) {
  res.json({ data: res.locals.order });
}

function create(req, res, next) {
  const {
    data: {
      deliverTo,
      mobileNumber,
      //   status,
      dishes: [{ id, name, description, image_url, price, quantity }],
    } = {},
  } = req.body;

  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status: "pending",
    dishes: [{ id, name, description, image_url, price, quantity }],
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function update(req, res, next) {
  const order = res.locals.order;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  // update order
  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;

  res.json({ data: order });
}

function destroy(req, res, next) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);
  const deletedOrder = orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  read: [orderExists, read],
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    isDishValidArray,
    isDishQuantityValid,
    create,
  ],
  update: [
    orderExists,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    isDishValidArray,
    isDishQuantityValid,
    statusExists,
    isOrderIdMatchesRouteId,
    update,
  ],
  delete: [orderExists, isOrderStatusPending, destroy],
};
