import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { DataTable, Button, Dialog, Portal, TextInput } from 'react-native-paper';
import { getAuth } from 'firebase/auth';
import Styles from '../config/Styles';
import Languages from '../languages';
import LanguageContext from '../languages/LanguageContext';
import AppLoading from '../components/InnerLoading';
import AsyncStorage from '@react-native-async-storage/async-storage';

const auth = getAuth();

export default function Suivi(props) {
  const contextState = React.useContext(LanguageContext);
  const language = contextState.language;
  const Strings = Languages[language].texts;

  const [isLoaded, setIsLoaded] = useState(false);
  const [suiviData, setSuiviData] = useState([]);
  const [page, setPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [addDialogVisible, setAddDialogVisible] = useState(false);
  const [formData, setFormData] = useState({
    day: '',
    eat: '',
    training: '',
    userid: ''
  });

  useEffect(() => {
    loadSuiviData();
  }, []);

  const loadSuiviData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://192.168.1.93/gym/controller/get_suivi.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'list' }),
      });

      const data = await response.json();

      // Accept both {data: [...]} and [...] formats
      const items = Array.isArray(data) ? data : (data.data || []);
      setSuiviData(items);

      setIsLoaded(true);
      setLoading(false);
    } catch (error) {
      console.error('Error loading suivi data:', error);
      setSuiviData([]);
      setLoading(false);
      Alert.alert('Error', 'Failed to load data');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch('http://192.168.1.93/gym/controller/delete_suivi.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: selectedItem.id,
          action: 'delete'
        })
      });
      
      const result = await response.json();
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
      const response = await fetch('http://192.168.1.93/gym/controller/edit_suivi.php', {
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
      
      const result = await response.json();
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
      const response = await fetch('http://192.168.1.93/gym/controller/add_suivi.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          action: 'create'
        })
      });
      
      const result = await response.json();
      if (result.success) {
        loadSuiviData();
        setAddDialogVisible(false);
        setFormData({
          day: '',
          eat: '',
          training: '',
          userid: ''
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
      day: new Date().toISOString().split('T')[0], // Default to today's date
      eat: '',
      training: '',
      userid: auth.currentUser?.uid || ''
    });
    setAddDialogVisible(true);
  };

  if (!isLoaded) {
    return <AppLoading />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={Styles.HeaderProfile}>
          <Text style={Styles.TextProfile}>{Strings.ST147}</Text>
          <Button 
            mode="contained" 
            style={styles.addButton}
            onPress={openAddDialog}
            labelStyle={styles.buttonLabel}
          >
            Add New
          </Button>
        </View>

        <View style={styles.tableContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : (
            <View>
              {suiviData.length > 0 ? (
                suiviData.slice(page * itemsPerPage, (page + 1) * itemsPerPage).map((item) => (
                  <View key={item.id} style={styles.card}>
                    <Text style={styles.cardDay}>{item.day}</Text>
                    <Text style={styles.cardLabel}>What Eating:</Text>
                    <Text style={styles.cardText}>{item.eat}</Text>
                    <Text style={styles.cardLabel}>What Training:</Text>
                    <Text style={styles.cardText}>{item.training}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.noDataCard}>
                  <Text style={styles.noDataText}>No data available</Text>
                </View>
              )}
              {suiviData.length > 0 && (
                <DataTable.Pagination
                  page={page}
                  numberOfPages={Math.ceil(suiviData.length / itemsPerPage)}
                  onPageChange={(newPage) => setPage(newPage)}
                  label={`${page * itemsPerPage + 1}-${Math.min(
                    (page + 1) * itemsPerPage,
                    suiviData.length
                  )} of ${suiviData.length}`}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={setItemsPerPage}
                  itemsPerPageOptions={[5, 10, 15]}
                  showFastPaginationControls
                  selectPageDropdownLabel={'Rows per page'}
                />
              )}
            </View>
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
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Day</Text>
                <TextInput
                  label="Day"
                  value={formData.day}
                  onChangeText={(text) => setFormData({...formData, day: text})}
                  style={styles.inputGreen}
                  mode="outlined"
                  placeholder="YYYY-MM-DD"
                  theme={{ colors: { primary: '#388e3c', underlineColor: 'transparent' } }}
                />
                <Text style={styles.inputLabel}>What are you eating?</Text>
                <TextInput
                  label="Meals"
                  value={formData.eat}
                  onChangeText={(text) => setFormData({...formData, eat: text})}
                  style={styles.inputGreen}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  placeholder="Breakfast: ...\nLunch: ...\nDinner: ..."
                  theme={{ colors: { primary: '#388e3c', underlineColor: 'transparent' } }}
                />
                <Text style={styles.inputLabel}>What is your training?</Text>
                <TextInput
                  label="Workout"
                  value={formData.training}
                  onChangeText={(text) => setFormData({...formData, training: text})}
                  style={styles.inputGreen}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  placeholder="Morning: ...\nEvening: ..."
                  theme={{ colors: { primary: '#388e3c', underlineColor: 'transparent' } }}
                />
                <TextInput
                  label="User ID"
                  value={formData.userid}
                  onChangeText={(text) => setFormData({...formData, userid: text})}
                  style={styles.input}
                  mode="outlined"
                  disabled
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
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Day</Text>
                <TextInput
                  label="Day"
                  value={formData.day}
                  onChangeText={(text) => setFormData({...formData, day: text})}
                  style={styles.inputGreen}
                  mode="outlined"
                  placeholder="YYYY-MM-DD"
                  theme={{ colors: { primary: '#388e3c', underlineColor: 'transparent' } }}
                />
                <Text style={styles.inputLabel}>What are you eating?</Text>
                <TextInput
                  label="Meals"
                  value={formData.eat}
                  onChangeText={(text) => setFormData({...formData, eat: text})}
                  style={styles.inputGreen}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  placeholder="Breakfast: ...\nLunch: ...\nDinner: ..."
                  theme={{ colors: { primary: '#388e3c', underlineColor: 'transparent' } }}
                />
                <Text style={styles.inputLabel}>What is your training?</Text>
                <TextInput
                  label="Workout"
                  value={formData.training}
                  onChangeText={(text) => setFormData({...formData, training: text})}
                  style={styles.inputGreen}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  placeholder="Morning: ...\nEvening: ..."
                  theme={{ colors: { primary: '#388e3c', underlineColor: 'transparent' } }}
                />
                <TextInput
                  label="User ID"
                  value={formData.userid}
                  onChangeText={(text) => setFormData({...formData, userid: text})}
                  style={styles.input}
                  mode="outlined"
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
    backgroundColor: '#black',
  },
  tableContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  row: {
    minHeight: 80,
  },
  dayColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  eatColumn: {
    flex: 2,
    maxHeight: 80,
  },
  trainingColumn: {
    flex: 2,
    maxHeight: 80,
  },
  addButton: {
    marginTop: 10,
    backgroundColor: '#388e3c',
    borderRadius: 4,
  },
  input: {
    marginBottom: 10,
    backgroundColor: '#fff',
    borderColor: '#388e3c',
    borderWidth: 1,
    borderRadius: 6,
  },
  buttonLabel: {
    fontSize: 12,
    paddingVertical: 4,
  },
  scrollCell: {
    maxHeight: 80,
  },
  noDataCell: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  noDataText: {
    color: '#666',
    fontSize: 16,
  },
  inputContainer: {
    backgroundColor: '#e8f5e9',
    borderRadius: 10,
    padding: 16,
    margin: 16,
    marginBottom: 0,
    shadowColor: '#388e3c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputLabel: {
    color: '#388e3c',
    fontWeight: 'bold',
    marginBottom: 4,
    marginTop: 10,
    fontSize: 16,
  },
  inputGreen: {
    backgroundColor: '#fff',
    borderColor: '#388e3c',
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 10,
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
  noDataCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 24,
    alignItems: 'center',
    margin: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
});