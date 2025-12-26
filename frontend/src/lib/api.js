import axios from "axios";

const API_URL = import.meta.env.PROD ? "" : "http://127.0.0.1:8000";
// --- 報表與數據獲取 ---

export const fetchAnalysisReport = async (startDate, endDate) => {
  try {
    const response = await axios.post(`${API_URL}/api/analyze/get_report`, {
      start_date_time: startDate,
      end_date_time: endDate,
    });
    return response.data;
  } catch (error) {
    console.error("Fetch Analysis Error:", error);
    return null;
  }
};

export const fetchMonthlyLogs = async (startDate, endDate) => {
  try {
    const response = await axios.get(`${API_URL}/api/database/logs`, {
      params: {
        start_date: startDate,
        end_date: endDate,
        sort_by: "timestamp",
        reverse: false, 
        limit: 1000,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Fetch Monthly Logs Error:", error);
    return [];
  }
};

export const fetchMonthlyLogsForTable = async (startDate, endDate) => {
  try {
    const response = await axios.get(`${API_URL}/api/database/logs`, {
      params: {
        start_date: startDate,
        end_date: endDate,
        sort_by: "timestamp",
        reverse: true, // 表格要看最新的
        limit: 1000,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Fetch Table Logs Error:", error);
    return [];
  }
};

export const fetchGoalReport = async (startDate, endDate) => {
  try {
    const response = await axios.get(`${API_URL}/api/goal/report`, {
      params: {
        start_date: startDate,
        end_date: endDate,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Fetch Goal Report Error:", error);
    return null;
  }
};

export const getCategories = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/database/categories`);
    return response.data;
  } catch (error) {
    console.error("Fetch Categories Error:", error);
    return [];
  }
};

// --- CRUD 操作 ---

// 新增交易
export const createLog = async (logData) => {
  // logData 格式: { category_name, amount, note, actual_type }
  const response = await axios.post(`${API_URL}/api/database/logs`, logData);
  return response.data;
};

// 刪除交易
export const deleteLog = async (logId) => {
  const response = await axios.delete(`${API_URL}/api/database/logs/${logId}`);
  return response.data;
};

// 新增類別
export const createCategory = async (name, type) => {
  const response = await axios.post(`${API_URL}/api/database/categories`, {
    name: name,
    default_direction: type 
  });
  return response.data;
};
export const fetchFilteredLogs = async (params) => {
  // params: { category_name, min_amount, max_amount, start_date, end_date, note_keyword, sort_by, reverse }
  try {
    const response = await axios.get(`${API_URL}/api/database/logs`, { params });
    return response.data;
  } catch (error) {
    console.error("Fetch Filtered Logs Error:", error);
    return [];
  }
};


// [新增] 修改交易
export const updateLog = async (logId, logData) => {
  // logData: { category_name, amount, actual_type, note, timestamp }
  const response = await axios.put(`${API_URL}/api/database/logs/${logId}`, logData);
  return response.data;
};


// [新增] 修改類別
export const updateCategory = async (id, name, type) => {
  const response = await axios.put(`${API_URL}/api/database/categories/${id}`, {
    name: name,
    default_direction: type
  });
  return response.data;
};

// [新增] 刪除類別 (後端 API 是依名稱刪除)
export const deleteCategory = async (name) => {
  const response = await axios.delete(`${API_URL}/api/database/categories/${name}`);
  return response.data;
};