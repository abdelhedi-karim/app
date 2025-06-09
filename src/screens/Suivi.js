import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Alert, Platform, FlatList, RefreshControl } from 'react-native';
import { DataTable, Button, Dialog, Portal, TextInput } from 'react-native-paper';
import { getAuth } from 'firebase/auth';
import DateTimePicker from '@react-native-community/datetimepicker';
import Styles from '../config/Styles';
import Languages from '../languages';
import LanguageContext from '../languages/LanguageContext';
import AppLoading from '../components/InnerLoading';
import usePreferences from '../hooks/usePreferences';

const auth = getAuth();

export default function Suivi(props) {
  const contextState = React.useContext(LanguageContext);
  const language = contextState.language;
  const Strings = Languages[language].texts;
  const { theme } = usePreferences();

  const [isLoaded, setIsLoaded] = useState(false);
  const [suiviData, setSuiviData] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [addDialogVisible, setAddDialogVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('date');
  const [formData, setFormData] = useState({
    day: new Date().toISOString().split('T')[0],
    eat: '',
    training: '',
    userid: auth.currentUser?.uid || ''
  });
  const [refreshing, setRefreshing] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [listData, setListData] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10;

  useEffect(() => {
    loadSuiviData();
  }, []);

  useEffect(() => {
    setListData(suiviData.slice(0, PAGE_SIZE));
    setHasMore(suiviData.length > PAGE_SIZE);
  }, [suiviData]);

  const loadSuiviData = async (pageToLoad = 0, append = false) => {
    try {
      if (pageToLoad === 0) setLoading(true);
      const response = await fetch('https://api.mahmoud-fitpro.com:8443/controller/get_suivi.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'list',
          userid: auth.currentUser?.uid,
          page: pageToLoad,
          limit: PAGE_SIZE
        }),
      });
      const data = await response.json();
      const items = Array.isArray(data) ? data : (data.data || []);
      setHasMore(items.length === PAGE_SIZE);
      if (append) {
        setSuiviData(prev => [...prev, ...items]);
      } else {
        setSuiviData(items);
      }
      setIsLoaded(true);
      setLoading(false);
    } catch (error) {
      console.error('Error loading suivi data:', error);
      setSuiviData([]);
      setLoading(false);
      Alert.alert('Error', 'Failed to load data');
    }
  };

  const handleLoadMore = () => {
    if (fetchingMore || !hasMore) return;
    setFetchingMore(true);
    setTimeout(() => {
      const nextData = suiviData.slice(0, listData.length + PAGE_SIZE);
      setListData(nextData);
      setHasMore(nextData.length < suiviData.length);
      setFetchingMore(false);
    }, 300);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(0);
    loadSuiviData(0, false).then(() => setRefreshing(false));
  };

  const handleDelete = async () => {
    try {
      const response = await fetch('https://api.mahmoud-fitpro.com:8443/controller/delete_suivi.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: selectedItem.id,
          action: 'delete'
        })
      });
      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (jsonError) {
        console.error('Raw response (delete):', text);
        throw new Error('Server did not return valid JSON. See console for details.');
      }
      if (result.success) {
        loadSuiviData();
        setDeleteDialogVisible(false);
      } else {
        throw new Error(result.message || 'Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting suivi item:', error);
      Alert.alert(Strings.ST32, error.message || 'Failed to delete item');
    }
  };

  const handleEdit = async () => {
    try {
      const response = await fetch('https://api.mahmoud-fitpro.com:8443/controller/edit_suivi.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          id: selectedItem.id,
          action: 'update'
        })
      });
      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (jsonError) {
        console.error('Raw response (edit):', text);
        throw new Error('Server did not return valid JSON. See console for details.');
      }
      if (result.success) {
        loadSuiviData();
        setEditDialogVisible(false);
      } else {
        throw new Error(result.message || 'Failed to update');
      }
    } catch (error) {
      console.error('Error editing suivi item:', error);
      Alert.alert(Strings.ST32, error.message || 'Failed to update item');
    }
  };

  const handleAdd = async () => {
    try {
      const response = await fetch('https://api.mahmoud-fitpro.com:8443/controller/new_suivi.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          action: 'create'
        })
      });
      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (jsonError) {
        console.error('Raw response (add):', text);
        throw new Error('Server did not return valid JSON. See console for details.');
      }
      if (result.success) {
        loadSuiviData();
        setAddDialogVisible(false);
        setFormData({
          day: new Date().toISOString().split('T')[0],
          eat: '',
          training: '',
          userid: auth.currentUser?.uid || ''
        });
      } else {
        throw new Error(result.message || 'Failed to add');
      }
    } catch (error) {
      console.error('Error adding suivi item:', error);
      Alert.alert(Strings.ST32, error.message || 'Failed to add item');
    }
  };

  const openEditDialog = (item) => {
    setSelectedItem(item);
    setFormData({
      day: item.day,
      eat: item.eat,
      training: item.training,
      userid: item.userid
    });
    setEditDialogVisible(true);
  };

  const openDeleteDialog = (item) => {
    setSelectedItem(item);
    setDeleteDialogVisible(true);
  };

  const openAddDialog = () => {
    setFormData({
      day: new Date().toISOString().split('T')[0],
      eat: '',
      training: '',
      userid: auth.currentUser?.uid || ''
    });
    setAddDialogVisible(true);
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios'); // Keep picker open on iOS
    
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setFormData({...formData, day: formattedDate});
    }
  };

  if (!isLoaded) {
    return <AppLoading />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme === 'dark' ? '#121212' : '#fff' }]}> 
      <ScrollView style={{ backgroundColor: theme === 'dark' ? '#121212' : '#fff' }}>
        <View style={Styles.HeaderProfile}>
          <Button 
            mode="contained" 
            style={[styles.addButton, {flexDirection: 'row', alignItems: 'center', elevation: 4, shadowColor: '#388e3c', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.3, shadowRadius: 6, backgroundColor: theme === 'dark' ? '#388e3c' : '#4CAF50'}]}
            onPress={openAddDialog}
            labelStyle={[styles.buttonLabel, {fontWeight: 'bold', fontSize: 16, color: '#fff', letterSpacing: 1}]}
            icon="plus-circle"
            contentStyle={{flexDirection: 'row-reverse'}}
          >
            Add New
          </Button>
        </View>
        <View style={styles.tableContainer}>
          {loading ? (
            <ActivityIndicator size="large" color={theme === 'dark' ? '#fff' : '#0000ff'} />
          ) : (
            <FlatList
              data={listData}
              keyExtractor={item => item.id?.toString()}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <Text style={styles.cardDay}>{item.day}</Text>
                  <Text style={styles.cardLabel}>What Eating:</Text>
                  <Text style={styles.cardText}>{item.eat}</Text>
                  <Text style={styles.cardLabel}>What Training:</Text>
                  <Text style={styles.cardText}>{item.training}</Text>
                  <View style={styles.cardActions}>
                    <Button 
                      mode="outlined" 
                      onPress={() => openEditDialog(item)}
                      style={styles.actionButton}
                    >
                      Edit
                    </Button>
                    <Button 
                      mode="outlined" 
                      onPress={() => openDeleteDialog(item)}
                      style={[styles.actionButton, {borderColor: '#ff4444'}]}
                      textColor="#ff4444"
                    >
                      Delete
                    </Button>
                  </View>
                </View>
              )}
              ListEmptyComponent={() => (
                <View style={styles.noDataCard}>
                  <Text style={styles.noDataText}>No data available</Text>
                </View>
              )}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.2}
              refreshing={refreshing}
              onRefresh={onRefresh}
              ListFooterComponent={fetchingMore && hasMore ? <ActivityIndicator size="small" color={theme === 'dark' ? '#fff' : '#388e3c'} style={{margin: 10}} /> : null}
            />
          )}
        </View>

        {/* Delete Confirmation Dialog */}
        <Portal>
          <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
            <Dialog.Title>Confirm Delete</Dialog.Title>
            <Dialog.Content>
              <Text>Are you sure you want to delete this item?</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
              <Button onPress={handleDelete} textColor="#FF0000">Delete</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* Edit Dialog */}
        <Portal>
          <Dialog visible={editDialogVisible} onDismiss={() => setEditDialogVisible(false)}>
            <Dialog.Title>Edit Item</Dialog.Title>
            <Dialog.Content>
              <View style={Styles.AuthContent}>
                <Text style={[Styles.inputLabel, { color: theme === 'dark' ? '#fff' : '#388e3c' }]}>Day</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    label="Day"
                    value={formData.day}
                    onFocus={showDatepicker}
                    style={Styles.AuthInput}
                    mode="outlined"
                    placeholder="YYYY-MM-DD"
                    theme={{
                      colors: {
                        primary: theme === 'dark' ? '#4CAF50' : '#388e3c',
                        text: theme === 'dark' ? '#fff' : '#000',
                        placeholder: theme === 'dark' ? '#aaa' : '#888',
                        background: theme === 'dark' ? '#1e1e1e' : '#fff',
                      },
                    }}
                  />
                  <Button 
                    icon="calendar" 
                    onPress={showDatepicker}
                    style={{ marginLeft: 10, height: 56, justifyContent: 'center' }}
                  >
                    Pick Date
                  </Button>
                </View>
                {showDatePicker && (
                  <DateTimePicker
                    value={new Date(formData.day)}
                    mode={datePickerMode}
                    display="default"
                    onChange={onDateChange}
                  />
                )}
                <Text style={[Styles.inputLabel, { color: theme === 'dark' ? '#fff' : '#388e3c' }]}>What are you eating?</Text>
                <TextInput
                  label="Meals"
                  value={formData.eat}
                  onChangeText={(text) => setFormData({...formData, eat: text})}
                  style={Styles.AuthInput}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  placeholder="Breakfast: ...\nLunch: ...\nDinner: ..."
                  theme={{
                    colors: {
                      primary: theme === 'dark' ? '#4CAF50' : '#388e3c',
                      text: theme === 'dark' ? '#fff' : '#000',
                      placeholder: theme === 'dark' ? '#aaa' : '#888',
                      background: theme === 'dark' ? '#1e1e1e' : '#fff',
                    },
                  }}
                />
                <Text style={[Styles.inputLabel, { color: theme === 'dark' ? '#fff' : '#388e3c' }]}>What is your training?</Text>
                <TextInput
                  label="Workout"
                  value={formData.training}
                  onChangeText={(text) => setFormData({...formData, training: text})}
                  style={Styles.AuthInput}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  placeholder="Morning: ...\nEvening: ..."
                  theme={{
                    colors: {
                      primary: theme === 'dark' ? '#4CAF50' : '#388e3c',
                      text: theme === 'dark' ? '#fff' : '#000',
                      placeholder: theme === 'dark' ? '#aaa' : '#888',
                      background: theme === 'dark' ? '#1e1e1e' : '#fff',
                    },
                  }}
                />
              </View>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setEditDialogVisible(false)}>Cancel</Button>
              <Button onPress={handleEdit}>Save</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* Add Dialog */}
        <Portal>
          <Dialog visible={addDialogVisible} onDismiss={() => setAddDialogVisible(false)}>
            <Dialog.Title>Add New Item</Dialog.Title>
            <Dialog.Content>
              <View style={Styles.AuthContent}>
                <Text style={[Styles.inputLabel, { color: theme === 'dark' ? '#fff' : '#388e3c' }]}>Day</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    label="Day"
                    value={formData.day}
                    onFocus={showDatepicker}
                    style={Styles.AuthInput}
                    mode="outlined"
                    placeholder="YYYY-MM-DD"
                    theme={{
                      colors: {
                        primary: theme === 'dark' ? '#4CAF50' : '#388e3c',
                        text: theme === 'dark' ? '#fff' : '#000',
                        placeholder: theme === 'dark' ? '#aaa' : '#888',
                        background: theme === 'dark' ? '#1e1e1e' : '#fff',
                      },
                    }}
                  />
                  <Button 
                    icon="calendar" 
                    onPress={showDatepicker}
                    style={{ marginLeft: 10, height: 56, justifyContent: 'center' }}
                  >
                    Pick Date
                  </Button>
                </View>
                {showDatePicker && (
                  <DateTimePicker
                    value={new Date(formData.day)}
                    mode={datePickerMode}
                    display="default"
                    onChange={onDateChange}
                  />
                )}
                <Text style={[Styles.inputLabel, { color: theme === 'dark' ? '#fff' : '#388e3c' }]}>What are you eating?</Text>
                <TextInput
                  label="Meals"
                  value={formData.eat}
                  onChangeText={(text) => setFormData({...formData, eat: text})}
                  style={Styles.AuthInput}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  placeholder="Breakfast: ...\nLunch: ...\nDinner: ..."
                  theme={{
                    colors: {
                      primary: theme === 'dark' ? '#4CAF50' : '#388e3c',
                      text: theme === 'dark' ? '#fff' : '#000',
                      placeholder: theme === 'dark' ? '#aaa' : '#888',
                      background: theme === 'dark' ? '#1e1e1e' : '#fff',
                    },
                  }}
                />
                <Text style={[Styles.inputLabel, { color: theme === 'dark' ? '#fff' : '#388e3c' }]}>What is your training?</Text>
                <TextInput
                  label="Workout"
                  value={formData.training}
                  onChangeText={(text) => setFormData({...formData, training: text})}
                  style={Styles.AuthInput}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  placeholder="Morning: ...\nEvening: ..."
                  theme={{
                    colors: {
                      primary: theme === 'dark' ? '#4CAF50' : '#388e3c',
                      text: theme === 'dark' ? '#fff' : '#000',
                      placeholder: theme === 'dark' ? '#aaa' : '#888',
                      background: theme === 'dark' ? '#1e1e1e' : '#fff',
                    },
                  }}
                />
              </View>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setAddDialogVisible(false)}>Cancel</Button>
              <Button onPress={handleAdd}>Add</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tableContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  addButton: {
    marginTop: 10,
    backgroundColor: '#388e3c',
    borderRadius: 4,
  },
  buttonLabel: {
    fontSize: 12,
    paddingVertical: 4,
  },
  card: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    marginHorizontal: 8,
    shadowColor: '#388e3c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  cardDay: {
    color: '#388e3c',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 8,
  },
  cardLabel: {
    color: '#2e7d32',
    fontWeight: 'bold',
    marginTop: 4,
    fontSize: 15,
  },
  cardText: {
    color: '#333',
    fontSize: 15,
    marginBottom: 4,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  actionButton: {
    marginLeft: 10,
    borderColor: '#388e3c',
  },
  noDataCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 24,
    alignItems: 'center',
    margin: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  noDataText: {
    color: '#666',
    fontSize: 16,
  },
});