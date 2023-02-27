exports.getDate = () => {

  const today = new Date()

  const options = {
    weekday: "long",
    day: "numeric",
    month: "long"
  };
  console.log(today.toLocaleDateString("en-US", options))
  return today.toLocaleDateString("en-US", options)

}
