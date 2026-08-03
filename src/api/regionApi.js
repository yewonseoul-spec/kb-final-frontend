import axios from 'axios';

const BASE_URL = '/api/benefit/regions';

export const getRegions = async (parentRegionCode) => {
  const { data } = await axios.get(BASE_URL, {
    params: { parentRegionCode: parentRegionCode || undefined },
  });
  return data;
};
