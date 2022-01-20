const paginate = (currentPage, imagesPerPage, array) => {
  const indexOfLastImage = currentPage * imagesPerPage;
  const indexOfFirstImage = indexOfLastImage - imagesPerPage;
  const currentImages = array.slice(indexOfFirstImage, indexOfLastImage);
  const pages = Math.ceil(array.length / imagesPerPage);
  return { currentImages, pages };
};

export default paginate;
