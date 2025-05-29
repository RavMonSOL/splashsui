// src/pages/LaunchpadPage.jsx
import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import { PlusCircle, Rocket } from 'lucide-react';

const LaunchpadPage = ({ launchpadProjects, onNavigate, onCreateLaunchpadProject }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    tokenName: '', tokenSymbol: '', totalSupply: '', description: '',
    logoUrl: '', website: '', twitter: '', telegram: '',
    fundingGoal: '', salePrice: '', endsIn: '30 days',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateToken = () => {
    if (!formData.tokenName || !formData.tokenSymbol || !formData.totalSupply || !formData.fundingGoal || !formData.salePrice) {
      alert("Please fill in all required fields for token creation.");
      return;
    }
    
    const newProject = {
        id: `launch${Date.now()}`,
        name: formData.tokenName,
        symbol: formData.tokenSymbol.toUpperCase(), // Ensure symbol is consistent (e.g., uppercase)
        startPrice: parseFloat(formData.salePrice) || 0, // Store salePrice as startPrice
        description: formData.description,
        goal: `${parseFloat(formData.fundingGoal).toLocaleString()} SUI`,
        raised: '0 SUI', // Initial raised amount
        endsIn: formData.endsIn,
        logo: formData.logoUrl || `https://placehold.co/60x60/cccccc/111111?text=${formData.tokenSymbol.substring(0,2).toUpperCase()}`,
        // You can add other fields from formData if needed by other parts of the app
        website: formData.website,
        twitter: formData.twitter,
        telegram: formData.telegram,
        totalSupply: formData.totalSupply,
    };

    if (onCreateLaunchpadProject) {
        onCreateLaunchpadProject(newProject); // Call the function passed from App.jsx
    } else {
        console.warn("onCreateLaunchpadProject prop is missing in LaunchpadPage");
    }


    setShowCreateModal(false);
    setFormData({ // Reset form
        tokenName: '', tokenSymbol: '', totalSupply: '', description: '',
        logoUrl: '', website: '', twitter: '', telegram: '',
        fundingGoal: '', salePrice: '', endsIn: '30 days',
    });
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">Token Launchpad</h1>
        <Button onClick={() => setShowCreateModal(true)} icon={PlusCircle}>Launch Your Token</Button>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Active Launches</h2>
        {launchpadProjects && launchpadProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {launchpadProjects.map(project => (
              <Card key={project.id} className="hover:shadow-xl transition-shadow duration-200 flex flex-col">
                <div className="flex items-start mb-3">
                  <img src={project.logo} alt={project.name} className="w-16 h-16 rounded-lg mr-4 object-cover" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{project.name} ({project.symbol || 'N/A'})</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Ends in: {project.endsIn}</p>
                    {project.startPrice !== undefined && <p className="text-xs text-gray-500 dark:text-gray-400">Start Price: ${project.startPrice.toFixed(4)}</p>}
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 flex-grow line-clamp-3">{project.description}</p>
                <div className="mb-2">
                  <div className="flex justify-between text-sm text-gray-700 dark:text-gray-200 mb-1">
                    <span>Progress</span>
                    <span>{((parseFloat(project.raised.replace(/,/g, '').replace(' SUI', '')) / parseFloat(project.goal.replace(/,/g, '').replace(' SUI', ''))) * 100 || 0).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                  <div className="bg-gradient-to-r from-green-400 to-blue-500 h-2.5 rounded-full" style={{ width: `${((parseFloat(project.raised.replace(/,/g, '').replace(' SUI', '')) / parseFloat(project.goal.replace(/,/g, '').replace(' SUI', ''))) * 100 || 0)}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">{project.raised} / {project.goal}</p>
                </div>
                <Button 
                  className="w-full mt-auto" 
                  onClick={() => {
                      const tokenForNavigation = {
                          id: project.id,
                          name: project.name,
                          logo: project.logo,
                          description: project.description,
                          symbol: project.symbol || project.name.substring(0,3).toUpperCase() + "L",
                          price: project.startPrice !== undefined ? project.startPrice : 0.001, // Use startPrice if available
                          change: "N/A", // New launches might not have a 24h change
                          // Include any other relevant project details that TradingPage might use
                          isLaunch: true, // Custom flag to indicate this is a launchpad item
                          goal: project.goal,
                          raised: project.raised,
                          endsIn: project.endsIn,
                      };
                      if (onNavigate) {
                        onNavigate('trading', { token: tokenForNavigation });
                      } else {
                        console.warn("onNavigate prop is missing in LaunchpadPage for project click");
                      }
                  }}
                >
                  View Project
                </Button>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-8">
            <Rocket size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-2" />
            <p className="text-gray-500 dark:text-gray-400">No active launches at the moment. Be the first!</p>
          </Card>
        )}
      </div>
      
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Launch a New Token">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Fill in the details below to create your new token and launch it on the platform.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
            <Input label="Token Name" name="tokenName" placeholder="e.g., My Awesome Coin" value={formData.tokenName} onChange={handleInputChange} required />
            <Input label="Token Symbol" name="tokenSymbol" placeholder="e.g., MAC (3-5 chars)" value={formData.tokenSymbol} onChange={handleInputChange} required />
            <Input label="Total Supply" name="totalSupply" type="number" placeholder="e.g., 1000000" value={formData.totalSupply} onChange={handleInputChange} required />
            <Input label="Funding Goal (SUI)" name="fundingGoal" type="number" placeholder="e.g., 10000" value={formData.fundingGoal} onChange={handleInputChange} required />
            <Input label="Initial Sale Price (SUI per Token)" name="salePrice" type="number" step="0.000001" placeholder="e.g., 0.01" value={formData.salePrice} onChange={handleInputChange} required />
            <Input label="Ends In (e.g., 30 days, 24 hours)" name="endsIn" placeholder="e.g., 30 days" value={formData.endsIn} onChange={handleInputChange} required />
            <Input label="Logo Image URL" name="logoUrl" placeholder="https://example.com/logo.png" value={formData.logoUrl} onChange={handleInputChange} />
            <Textarea label="Description (Max 200 chars)" name="description" placeholder="Describe your token and its utility." value={formData.description} onChange={handleInputChange} className="sm:col-span-2" rows={3} maxLength={200}/>
            <Input label="Website (Optional)" name="website" placeholder="https://example.com" value={formData.website} onChange={handleInputChange} className="sm:col-span-2" />
            <Input label="X/Twitter URL (Optional)" name="twitter" placeholder="https://x.com/yourproject" value={formData.twitter} onChange={handleInputChange} />
            <Input label="Telegram URL (Optional)" name="telegram" placeholder="https://t.me/yourproject" value={formData.telegram} onChange={handleInputChange} />
        </div>
        <div className="flex justify-end space-x-2 mt-6 pt-4 border-t dark:border-gray-700">
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
          <Button onClick={handleCreateToken}>Create & Launch Token</Button>
        </div>
      </Modal>
    </div>
  );
};

export default LaunchpadPage;