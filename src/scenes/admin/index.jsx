import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material';
import { BarChart, PieChart, LineChart, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Line, Bar, Pie, Cell, ResponsiveContainer } from 'recharts';
import Sidebar from '../global/Sidebar';
import Topbar from '../global/Topbar';
import axios from 'axios';
import { BACKEND_URL } from '../../config';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Admin = () => {
  const [tab, setTab] = useState(0);
  const [stats, setStats] = useState(null); 
  const [users, setUsers] = useState([]);
  const [usersPage, setUsersPage] = useState(0);
  const [usersRowsPerPage, setUsersRowsPerPage] = useState(10);
  const [usersTotal, setUsersTotal] = useState(0);
  const [monitorings, setMonitorings] = useState([]);
  const [monitoringsPage, setMonitoringsPage] = useState(0);
  const [monitoringsRowsPerPage, setMonitoringsRowsPerPage] = useState(10);
  const [monitoringsTotal, setMonitoringsTotal] = useState(0);
  const [assessments, setAssessments] = useState([]);
  const [assessmentsPage, setAssessmentsPage] = useState(0);
  const [assessmentsRowsPerPage, setAssessmentsRowsPerPage] = useState(10);
  const [assessmentsTotal, setAssessmentsTotal] = useState(0);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState('');


  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setStats({
        stat_0: res.data.totalUsers || 0,
        stat_1: res.data.totalMonitorings || 0,
        stat_2: res.data.totalAssessments || 0,
        stat_3: res.data.totalResponses || 0,
        stat_4: res.data.activeUsers || 0,
        stat_5: res.data.newUsersDay || 0,
        stat_6: res.data.newUsersWeek || 0,
        stat_7: res.data.newUsersMonth || 0,
        activeUsersList: res.data.activeUsersList || [],
        userGrowth: res.data.userGrowth || [],
        responseGrowth: res.data.responseGrowth || [],
        monitoringGrowth: res.data.monitoringGrowth || [],
        assessmentGrowth: res.data.assessmentGrowth || [],
        monitoringNames: res.data.monitoringNames || [],
        assessmentNames: res.data.assessmentNames || [],
        assessmentTypesDistribution: res.data.assessmentTypesDistribution || [],
        userStatusPie: res.data.userStatusPie || [],
      });
      setError('');
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to fetch stats');
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);


  // Fetch users with registration date
  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/admin/users`, {
        params: { page: usersPage, limit: usersRowsPerPage },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setUsers(res.data.docs);
      setUsersTotal(res.data.total);
    } catch (err) {
      setError('Failed to load users');
    }
  }, [usersPage, usersRowsPerPage]);

  // Fetch monitorings with details
  const fetchMonitorings = useCallback(async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/admin/monitorings`, {
        params: { page: monitoringsPage, limit: monitoringsRowsPerPage },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setMonitorings(res.data.docs);
      setMonitoringsTotal(res.data.total);
    } catch (err) {
      setError('Failed to load monitorings');
    }
  }, [monitoringsPage, monitoringsRowsPerPage]);

  // Fetch assessments with details
  const fetchAssessments = useCallback(async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/admin/assessments`, {
        params: { page: assessmentsPage, limit: assessmentsRowsPerPage },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setAssessments(res.data.docs);
      setAssessmentsTotal(res.data.total);
    } catch (err) {
      setError('Failed to load assessments');
    }
  }, [assessmentsPage, assessmentsRowsPerPage]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (tab === 1) {
      fetchUsers();
    }
  }, [tab, usersPage, usersRowsPerPage, fetchUsers]);

  useEffect(() => {
    if (tab === 2) {
      fetchMonitorings();
    }
  }, [tab, monitoringsPage, monitoringsRowsPerPage, fetchMonitorings]);

  useEffect(() => {
    if (tab === 2) {
      fetchAssessments();
    }
  }, [tab, assessmentsPage, assessmentsRowsPerPage, fetchAssessments]);

  const handleTabChange = (e, newValue) => setTab(newValue);

  return (
    <Box display="flex" style={{ height: '100vh', overflow: 'auto' }}>
      <Sidebar />
      <Box flex="1" flexDirection="column">
        <Box p={2}>
          <Topbar title="Admin" />
        </Box>
        <Box mx={2} mb={2}>
          <Tabs value={tab} onChange={handleTabChange} indicatorColor="primary" textColor="primary">
            <Tab label="Dashboard" />
            <Tab label="Users" />
            <Tab label="Monitoring and Assessment" />
          </Tabs>
        </Box>
        <Box flex="1" overflow="auto" p={2}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : tab === 0 ? (
            <DashboardTab stats={stats} fetchStats={fetchStats} loading={loading} />
          ) : tab === 1 ? (
            <UsersTab
              users={users}
              page={usersPage}
              rowsPerPage={usersRowsPerPage}
              total={usersTotal}
              setPage={setUsersPage}
              setRowsPerPage={setUsersRowsPerPage}
              activeUsersList={stats?.activeUsersList || []}
            />
          ) : (
            <MonitoringAndAssessmentTab
              monitorings={monitorings}
              monitoringsPage={monitoringsPage}
              monitoringsRowsPerPage={monitoringsRowsPerPage}
              monitoringsTotal={monitoringsTotal}
              setMonitoringsPage={setMonitoringsPage}
              setMonitoringsRowsPerPage={setMonitoringsRowsPerPage}
              assessments={assessments}
              assessmentsPage={assessmentsPage}
              assessmentsRowsPerPage={assessmentsRowsPerPage}
              assessmentsTotal={assessmentsTotal}
              setAssessmentsPage={setAssessmentsPage}
              setAssessmentsRowsPerPage={setAssessmentsRowsPerPage}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};

// DASHBOARD TAB COMPONENT
const DashboardTab = ({ stats, fetchStats, loading, setLoading, setStats }) => {
  const statLabels = [
    'Total Users',
    'Total Monitorings',
    'Total Assessments',
    'Total Responses',
    'Active Users (Last 2 Months)',
    'New Users Today',
    'New Users Week',
    'New Users Month',
  ];

  // Default empty data for charts
  const defaultChartData = {
    userGrowth: [],
    responseGrowth: [],
    monitoringGrowth: [],
    assessmentGrowth: [],
    assessmentTypesDistribution: [],
    userStatusPie: [],
  };

  const chartData = stats ? stats : defaultChartData;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Button variant="outlined" onClick={fetchStats} disabled={loading}>
          Refresh All Stats
        </Button>
      </Box>

      <Grid container spacing={3} mb={4}>
        {statLabels.map((label, i) => (
          <Grid item xs={12} sm={6} md={2} key={i}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2">{label}</Typography>
              <Typography variant="h5">
                {stats ? stats[`stat_${i}`] || 0 : 0}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4}>
        {/* User Growth Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 300 }}>
            <Typography variant="h6" mb={2}>User Growth - Registered Users</Typography>
            {chartData.userGrowth.length > 0 ? (
              <BarChart width={500} height={250} data={chartData.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="newUsers" fill="#0088FE" name="Registered Users" />
              </BarChart>
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <Typography>No data available</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* User Status Distribution Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 300 }}>
            <Typography variant="h6" mb={2}>User Status Distribution</Typography>
            {chartData.userStatusPie.length > 0 ? (
              <PieChart width={400} height={250}>
                <Pie
                  data={chartData.userStatusPie}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.userStatusPie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <Typography>No data available</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Monitoring Growth Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 300 }}>
            <Typography variant="h6" mb={2}>Monitorings Created Over Time</Typography>
            {chartData.monitoringGrowth && chartData.monitoringGrowth.length > 0 ? (
              <BarChart width={500} height={250} data={chartData.monitoringGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#00C49F" name="Monitorings" />
              </BarChart>
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <Typography>No data available</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Assessment Growth Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 300 }}>
            <Typography variant="h6" mb={2}>Assessments Created Over Time</Typography>
            {chartData.assessmentGrowth && chartData.assessmentGrowth.length > 0 ? (
              <BarChart width={500} height={250} data={chartData.assessmentGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#FFBB28" name="Assessments" />
              </BarChart>
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <Typography>No data available</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Response Growth Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 300 }}>
            <Typography variant="h6" mb={2}>Responses Created Over Time</Typography>
            {chartData.responseGrowth && chartData.responseGrowth.length > 0 ? (
              <BarChart width={500} height={250} data={chartData.responseGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#FF8042" name="Responses" />
              </BarChart>
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <Typography>No data available</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Assessment Types Distribution Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 300 }}>
            <Typography variant="h6" mb={2}>Assessment Types Distribution</Typography>
            {chartData.assessmentTypesDistribution && chartData.assessmentTypesDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart 
                  data={chartData.assessmentTypesDistribution}
                  margin={{ top: 20, right: 30, left: 20, bottom: 120 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="type" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="count" fill="#8884d8" name="Number of Assessments" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <Typography>No data available</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

    </Box>
  );
};

// USERS TAB COMPONENT
const UsersTab = ({ users, page, rowsPerPage, total, setPage, setRowsPerPage, activeUsersList }) => {
  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      {/* Active Users List */}
      <Box mb={4}>
        <Typography variant="h5" mb={2}>
          Active Users (Last 2 Months) - {activeUsersList?.length || 0}
        </Typography>
        {activeUsersList && activeUsersList.length > 0 ? (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Sandbox</TableCell>
                  <TableCell>Registration Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activeUsersList.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>{user.firstName} {user.lastName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.userStatus || 'N/A'}</TableCell>
                    <TableCell>{user.sandbox ? 'Yes' : 'No'}</TableCell>
                    <TableCell>
                      {user.registrationDate 
                        ? new Date(user.registrationDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No active users found
          </Typography>
        )}
      </Box>

      {/* All Users List */}
      <Typography variant="h5" mb={2}>All Users</Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Sandbox</TableCell>
              <TableCell>Registration Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell>{user.firstName} {user.lastName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.userStatus || 'N/A'}</TableCell>
                <TableCell>{user.sandbox ? 'Yes' : 'No'}</TableCell>
                <TableCell>
                  {user.registrationDate 
                    ? new Date(user.registrationDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'N/A'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
};

// MONITORING AND ASSESSMENT TAB COMPONENT
const MonitoringAndAssessmentTab = ({
  monitorings,
  monitoringsPage,
  monitoringsRowsPerPage,
  monitoringsTotal,
  setMonitoringsPage,
  setMonitoringsRowsPerPage,
  assessments,
  assessmentsPage,
  assessmentsRowsPerPage,
  assessmentsTotal,
  setAssessmentsPage,
  setAssessmentsRowsPerPage,
}) => {
  const handleMonitoringsPageChange = (_, newPage) => setMonitoringsPage(newPage);
  const handleMonitoringsRowsPerPageChange = (e) => {
    setMonitoringsRowsPerPage(parseInt(e.target.value, 10));
    setMonitoringsPage(0);
  };

  const handleAssessmentsPageChange = (_, newPage) => setAssessmentsPage(newPage);
  const handleAssessmentsRowsPerPageChange = (e) => {
    setAssessmentsRowsPerPage(parseInt(e.target.value, 10));
    setAssessmentsPage(0);
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Monitorings Table */}
        <Grid item xs={12}>
          <Typography variant="h5" mb={2}>Monitorings</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Creation Date</TableCell>
                  <TableCell>Number of Responses</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {monitorings.map((monitoring) => (
                  <TableRow key={monitoring._id}>
                    <TableCell>{monitoring.name}</TableCell>
                    <TableCell>{monitoring.owner}</TableCell>
                    <TableCell>
                      {new Date(monitoring.creationDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell>{monitoring.responseCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={monitoringsTotal}
              page={monitoringsPage}
              onPageChange={handleMonitoringsPageChange}
              rowsPerPage={monitoringsRowsPerPage}
              onRowsPerPageChange={handleMonitoringsRowsPerPageChange}
            />
          </TableContainer>
        </Grid>

        {/* Assessments Table */}
        <Grid item xs={12}>
          <Typography variant="h5" mb={2} mt={4}>Assessments</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Creation Date</TableCell>
                  <TableCell>Number of Responses</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assessments.map((assessment) => (
                  <TableRow key={assessment._id}>
                    <TableCell>{assessment.name}</TableCell>
                    <TableCell>{assessment.owner}</TableCell>
                    <TableCell>
                      {new Date(assessment.creationDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell>{assessment.responseCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={assessmentsTotal}
              page={assessmentsPage}
              onPageChange={handleAssessmentsPageChange}
              rowsPerPage={assessmentsRowsPerPage}
              onRowsPerPageChange={handleAssessmentsRowsPerPageChange}
            />
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Admin;