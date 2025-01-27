import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import ButtonBase from "@mui/material/ButtonBase";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Page from "./components/Page";
import Dexie from "dexie";
import { useLiveQuery } from "dexie-react-hooks";
import InfiniteScroll from "react-infinite-scroll-component";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { GlobalContext } from "./App";

const styles = {
  channelItemGrid: {
    minHeight: 148,
    border: "3px solid rgba(0,0,0,.1)",
  },
  buttonBase: {
    width: "100%",
    height: "100%",
    padding: "20px",
    overflow: "hidden",
  },
  lazyLoadImage: {
    width: "auto",
    height: "auto",
    maxWidth: 120,
    maxHeight: 120,
  },
};

// Create database and playlist store/collection
const db = new Dexie("IPTV");
db.version(1).stores({
  playlists: "++id,&name,data",
});

export default function Home() {
  const navigate = useNavigate();
  const [categoryNames, setCategoryNames] = useState([]);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [totalDataToShow, setTotalDataToShow] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [dataToShow, setDataToShow] = useState([]);

  const chipStackRef = useRef(null);
  const { selectedPlaylistName, searchTerm, setCurrentChannelData } =
    useContext(GlobalContext);

  const perPage = 30;

  useEffect(() => {
    setSelectedCategoryIndex(0);
    setPageNum(1);
    setDataToShow([]);
    setTotalDataToShow(0);
    scrollToTop();
    chipStackRef?.current?.scrollTo({
      left: 0,
      behavior: "smooth",
    });
  }, [selectedPlaylistName]);

  useEffect(() => {
    setPageNum(1);
    setDataToShow([]);
    setTotalDataToShow(0);
  }, [selectedCategoryIndex]);

  useLiveQuery(() => {
    db.open().then(() => {
      db.playlists
        .where("name")
        .equals(selectedPlaylistName)
        .toArray()
        .then((result) => {
          setTotalDataToShow(result[0].data.length);
          setCategoryNames([
            "All channels ",
            ...new Set(result[0].data.map((item) => item.group.title)),
          ]);
        });
    });
  }, [selectedPlaylistName]);

  useLiveQuery(() => {
    db.open().then(() => {
      db.playlists
        .where("name")
        .equals(selectedPlaylistName)
        .toArray()
        .then((result) => {
          const filteredData =
            selectedCategoryIndex === 0
              ? result[0]?.data?.filter((item) =>
                  item.name.toLowerCase().includes(searchTerm.toLowerCase())
                )
              : result[0]?.data?.filter(
                  (item) =>
                    item.group.title === categoryNames[selectedCategoryIndex] &&
                    item.name.toLowerCase().includes(searchTerm.toLowerCase())
                );
          setTotalDataToShow(filteredData.length);
          setDataToShow(
            Array.from(new Set([...filteredData.slice(0, perPage)]))
          );
        });
    });
  }, [selectedPlaylistName, selectedCategoryIndex, searchTerm]);

  useLiveQuery(() => {
    if (pageNum > 1) {
      db.open().then(() => {
        db.playlists
          .where("name")
          .equals(selectedPlaylistName)
          .toArray()
          .then((result) => {
            const filteredData =
              selectedCategoryIndex === 0
                ? result[0]?.data?.filter((item) =>
                    item.name.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                : result[0]?.data?.filter(
                    (item) =>
                      item.group.title ===
                        categoryNames[selectedCategoryIndex] &&
                      item.name.toLowerCase().includes(searchTerm.toLowerCase())
                  );
            setTotalDataToShow(filteredData.length);
            setDataToShow(
              Array.from(
                new Set([
                  ...dataToShow,
                  ...filteredData.slice(
                    Math.max(0, (pageNum - 1) * perPage),
                    pageNum * perPage
                  ),
                ])
              )
            );
          });
      });
    }
  }, [pageNum]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const fetchMoreData = () => {
    setPageNum((prevPageNum) => prevPageNum + 1);
  };

  const handleChannelClick = (channelObj) => {
    setCurrentChannelData(channelObj);
    navigate(`/live-tv/${channelObj.data.tvg.id}`);
  };

  return (
    <Page title="Ellipto IPTV">
      <Stack
        ref={chipStackRef}
        direction="row"
        spacing={1}
        sx={{
          p: 1,
          boxSizing: "border-box",
          overflow: "auto",
        }}
      >
        {categoryNames?.map((categoryName, categoryIndex) => (
          <Chip
            label={categoryName}
            color="primary"
            variant={
              selectedCategoryIndex === categoryIndex ? "filled" : "outlined"
            }
            onClick={() => setSelectedCategoryIndex(categoryIndex)}
            key={categoryIndex}
          />
        ))}
      </Stack>
      <InfiniteScroll
        dataLength={dataToShow?.length || 0}
        next={fetchMoreData}
        hasMore={pageNum < Math.ceil(totalDataToShow / perPage) || false}
        loader={
          <Box sx={{ my: 2, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        }
      >
        <Grid container>
          {dataToShow?.map((item, index) => (
            <Grid
              item
              key={index}
              xs={6}
              sm={3}
              md={2}
              style={styles.channelItemGrid}
            >
              <ButtonBase
                style={styles.buttonBase}
                onClick={() =>
                  handleChannelClick({
                    playlistName: selectedPlaylistName,
                    data: item,
                  })
                }
              >
                <Grid container>
                  <Grid item xs={12}>
                    <LazyLoadImage
                      src={item.tvg.logo}
                      alt=""
                      placeholder={<CircularProgress size="120px" />}
                      style={styles.lazyLoadImage}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    {item.name}
                  </Grid>
                </Grid>
              </ButtonBase>
            </Grid>
          ))}
        </Grid>
      </InfiniteScroll>
    </Page>
  );
}
