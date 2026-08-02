import { defineStore } from 'pinia';
import axios from '@/api';


const baseURL =  'http://localhost:8080'
const headers = {
    'Content-Type': 'application/json'
}

export const useConsumptionStore = defineStore('consumption', {
  state: () => ({
    calendarData: null,
    calendarLoading: false,
    calendarError: null,
  }),

  actions: {
    async getCalendar(yearMonth) {
      this.calendarLoading = true;
      this.calendarError = null;

      try {
        const res = await axios.get(`${baseURL}/consumption/calendar/${yearMonth}`, headers);
        this.calendarData = res.data;
      } catch (err) {
        console.error('캘린더 데이터 조회 실패:', err);
        this.calendarError = err;
        this.calendarData = null;
      } finally {
        this.calendarLoading = false;
      }
    },

    async addExpectedSpending({ expectedDate, categoryNo, expectedAmount, merchant, memo }) {
      try {
        await axios.post('/consumption/expected', {
          expectedDate,
          categoryNo,
          expectedAmount,
          merchant,
          memo,
        });
      } catch (err) {
        console.error('예상 소비 추가 실패:', err);
        throw err;
      }
    },

    async updateExpectedSpending(expectedNo, { date, categoryNo, amount, merchant, memo }) {
      try {
        await axios.put(`/consumption/expected/${expectedNo}`, {
          expectedDate: date,
          categoryNo,
          expectedAmount: amount,
          merchant,
          memo,
        });
      } catch (err) {
        console.error('예상 소비 수정 실패:', err);
        throw err;
      }
    },

    async deleteExpectedSpending(expectedNo) {
      try {
        await axios.delete(`/consumption/expected/${expectedNo}`);
      } catch (err) {
        console.error('예상 소비 삭제 실패:', err);
        throw err;
      }
    },
  },
});